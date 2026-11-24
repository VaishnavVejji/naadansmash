-- ====================================================================
-- NAADANSMASH: FULL SUPABASE SYNC, RLS FIX & FRESH DATABASE SETUP
-- ====================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/odnjkvxqypjklsjgxpoj/sql/new

-- 1. Grant table and schema permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.registrations TO anon, authenticated;
GRANT ALL ON TABLE public.events TO anon, authenticated;
GRANT ALL ON TABLE public.payment_settings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2. Enable Row Level Security (RLS) on registrations and grant full access
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can manage registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.registrations;

CREATE POLICY "Public can manage registrations" ON public.registrations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Drop the duplicate phone constraint so each registration gets a brand-new ID
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS unique_event_phone;

-- 4. Clear all old demo registrations so sessions start completely fresh (0 registrations)
DELETE FROM public.registrations;

-- 5. Reset Event #2 to published and ensure 24 slots available
UPDATE public.events 
SET status = 'published', max_participants = 24 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 6. Create/Update register_for_event function to allow fresh sequential registrations
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_age INTEGER DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_skill_level TEXT DEFAULT 'Intermediate',
  p_playing_category TEXT DEFAULT 'Open Doubles',
  p_emergency_contact TEXT DEFAULT NULL,
  p_utr_reference TEXT DEFAULT NULL,
  p_payment_screenshot_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_active_count INTEGER;
  v_reg_number TEXT;
  v_reg_id UUID;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF length(v_clean_phone) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_PHONE',
      'message', 'Please provide a valid 10-digit phone/WhatsApp number.'
    );
  END IF;

  -- 1. Lock the event record for atomic capacity check
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', 'The requested event could not be found.'
    );
  END IF;

  -- 2. Check that registration is open
  IF v_event.status != 'published' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'REGISTRATION_CLOSED',
      'message', 'Registrations are currently closed for this session.'
    );
  END IF;

  -- 3. Check registration deadline
  IF v_event.registration_deadline IS NOT NULL AND NOW() > v_event.registration_deadline THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DEADLINE_PASSED',
      'message', 'The registration deadline for this session has passed.'
    );
  END IF;

  -- 4. Check available capacity
  SELECT COUNT(*) INTO v_active_count
  FROM public.registrations
  WHERE event_id = p_event_id
    AND payment_status != 'rejected';

  IF v_active_count >= v_event.max_participants THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'This session has reached maximum capacity. All slots are booked.'
    );
  END IF;

  -- 5. Generate unique sequential registration number (NS-001, NS-002, ...)
  SELECT 'NS-' || lpad((COALESCE(MAX(SUBSTRING(registration_number FROM 'NS-([0-9]+)')::integer), 0) + 1)::text, 3, '0')
  INTO v_reg_number
  FROM public.registrations
  WHERE registration_number ~ '^NS-[0-9]+$';

  IF v_reg_number IS NULL THEN
    v_reg_number := 'NS-001';
  END IF;

  -- 6. Insert the registration atomically
  INSERT INTO public.registrations (
    registration_number,
    event_id,
    full_name,
    email,
    phone,
    age,
    gender,
    skill_level,
    playing_category,
    emergency_contact,
    payment_status,
    attendance_status,
    utr_reference,
    payment_screenshot_path
  ) VALUES (
    v_reg_number,
    p_event_id,
    trim(p_full_name),
    nullif(trim(p_email), ''),
    v_clean_phone,
    p_age,
    p_gender,
    p_skill_level,
    coalesce(nullif(trim(p_playing_category), ''), 'Open Doubles'),
    nullif(trim(p_emergency_contact), ''),
    'pending',
    'registered',
    nullif(trim(p_utr_reference), ''),
    nullif(trim(p_payment_screenshot_path), '')
  ) RETURNING id INTO v_reg_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration confirmed successfully!',
    'registration_number', v_reg_number,
    'id', v_reg_id,
    'event_id', p_event_id,
    'remaining_slots', (v_event.max_participants - (v_active_count + 1))
  );

EXCEPTION
  WHEN unique_violation THEN
    -- In rare collision, retry with next number
    v_reg_number := 'NS-' || lpad((floor(random() * 899 + 100)::int)::text, 3, '0');
    INSERT INTO public.registrations (
      registration_number, event_id, full_name, email, phone, age, gender,
      skill_level, playing_category, emergency_contact, payment_status,
      attendance_status, utr_reference, payment_screenshot_path
    ) VALUES (
      v_reg_number, p_event_id, trim(p_full_name), nullif(trim(p_email), ''),
      v_clean_phone, p_age, p_gender, p_skill_level,
      coalesce(nullif(trim(p_playing_category), ''), 'Open Doubles'),
      nullif(trim(p_emergency_contact), ''), 'pending', 'registered',
      nullif(trim(p_utr_reference), ''), nullif(trim(p_payment_screenshot_path), '')
    ) RETURNING id INTO v_reg_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Registration confirmed successfully!',
      'registration_number', v_reg_number,
      'id', v_reg_id,
      'event_id', p_event_id,
      'remaining_slots', (v_event.max_participants - (v_active_count + 1))
    );
END;
$$;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.register_for_event TO anon, authenticated;

-- 8. Verification queries
SELECT id, title, status, max_participants FROM public.events WHERE status = 'published';
SELECT COUNT(*) AS total_registrations FROM public.registrations;
