-- ====================================================================
-- NAADANSMASH: COMPLETE CLEAN DATABASE SETUP FOR PRODUCTION DEPLOYMENT
-- Project Ref: odnjkvxqypjklsjgxpoj
-- ====================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/odnjkvxqypjklsjgxpoj/sql/new

-- --------------------------------------------------------------------
-- 1. CLEAN ALL OLD TEST REGISTRATIONS (FRESH START: 0 PLAYERS)
-- --------------------------------------------------------------------
DELETE FROM public.registrations;

-- --------------------------------------------------------------------
-- 2. SETUP PRODUCTION EVENTS (SESSION #2 PUBLISHED & OPEN WITH 24 SLOTS)
-- --------------------------------------------------------------------
-- Ensure Event #2 is published, fee is ₹250, and all 24 slots are available
INSERT INTO public.events (
  id,
  title,
  description,
  event_date,
  start_time,
  end_time,
  venue,
  registration_fee,
  max_participants,
  registration_deadline,
  status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Weekend Evening Match Session - Smash Arena',
  'Weekend evening session scheduled by the coach. 3 hours of structured doubles rotations paired by skill level with refreshments included.',
  '2026-11-29',
  '17:30:00',
  '20:30:00',
  'Flymate Badminton Hub, Kakkanad, Kochi',
  250.00,
  24,
  '2026-11-29 16:00:00+05:30',
  'published'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  event_date = EXCLUDED.event_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  venue = EXCLUDED.venue,
  registration_fee = EXCLUDED.registration_fee,
  max_participants = 24,
  registration_deadline = EXCLUDED.registration_deadline,
  status = 'published';

-- Ensure Event #1 remains marked as completed historical match
INSERT INTO public.events (
  id,
  title,
  description,
  event_date,
  start_time,
  end_time,
  venue,
  registration_fee,
  max_participants,
  registration_deadline,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Weekend Smash — Session #1',
  'Inaugural weekend evening session. 24 players gathered for 3 hours of organized doubles rotations and friendly rallies.',
  '2026-11-15',
  '17:30:00',
  '20:30:00',
  'Flymate Badminton Hub, Kakkanad, Kochi',
  250.00,
  24,
  '2026-11-15 16:00:00+05:30',
  'completed'
) ON CONFLICT (id) DO UPDATE SET
  status = 'completed';

-- --------------------------------------------------------------------
-- 3. SETUP PRODUCTION PAYMENT SETTINGS (UPI: psivaram17-1@oksbi)
-- --------------------------------------------------------------------
INSERT INTO public.payment_settings (
  id,
  upi_id,
  qr_image_path,
  account_display_name,
  payment_instructions
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'psivaram17-1@oksbi',
  '/images/qr.jpeg',
  'Sivaram P Babu (NAADANSMASH)',
  'Transfer ₹250 via GPay, PhonePe, or Paytm to psivaram17-1@oksbi. Enter the 12-digit UTR reference number upon registration to expedite court check-in.'
) ON CONFLICT (id) DO UPDATE SET
  upi_id = EXCLUDED.upi_id,
  qr_image_path = EXCLUDED.qr_image_path,
  account_display_name = EXCLUDED.account_display_name,
  payment_instructions = EXCLUDED.payment_instructions,
  updated_at = NOW();

-- --------------------------------------------------------------------
-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES FOR FULL APP ACCESS
-- --------------------------------------------------------------------
-- Grant schema and sequence usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.registrations TO anon, authenticated;
GRANT ALL ON TABLE public.events TO anon, authenticated;
GRANT ALL ON TABLE public.payment_settings TO anon, authenticated;
GRANT ALL ON TABLE public.contact_inquiries TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Registrations RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Public can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.registrations;

CREATE POLICY "Public can manage registrations" ON public.registrations
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage events" ON public.events;
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Public can manage events" ON public.events
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Payment Settings RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Public can view payment settings" ON public.payment_settings;

CREATE POLICY "Public can manage payment settings" ON public.payment_settings
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Contact Inquiries RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Public can submit contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admins can view contact inquiries" ON public.contact_inquiries;

CREATE POLICY "Public can manage contact inquiries" ON public.contact_inquiries
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. REMOVE DUPLICATE PHONE RESTRICTION
-- --------------------------------------------------------------------
-- Allows participants to register multiple tickets or teammates
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS unique_event_phone;

-- --------------------------------------------------------------------
-- 6. ATOMIC REGISTRATION FUNCTION (SEQUENTIAL NS-001, NS-002...)
-- --------------------------------------------------------------------
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

  -- Lock event row for atomic slot count
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_FOUND', 'message', 'Event not found.');
  END IF;

  IF v_event.status != 'published' THEN
    RETURN jsonb_build_object('success', false, 'error', 'REGISTRATION_CLOSED', 'message', 'Registrations are closed for this session.');
  END IF;

  IF v_event.registration_deadline IS NOT NULL AND NOW() > v_event.registration_deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'DEADLINE_PASSED', 'message', 'The registration deadline has passed.');
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.registrations
  WHERE event_id = p_event_id AND payment_status != 'rejected';

  IF v_active_count >= v_event.max_participants THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_FULL', 'message', 'All slots are booked for this session.');
  END IF;

  -- Generate sequential ticket: NS-001, NS-002, NS-003...
  SELECT 'NS-' || lpad((COALESCE(MAX(SUBSTRING(registration_number FROM 'NS-([0-9]+)')::integer), 0) + 1)::text, 3, '0')
  INTO v_reg_number
  FROM public.registrations
  WHERE registration_number ~ '^NS-[0-9]+$';

  IF v_reg_number IS NULL THEN
    v_reg_number := 'NS-001';
  END IF;

  -- Insert registration record
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
    -- Fallback unique generator in case of concurrent slot allocation
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

-- --------------------------------------------------------------------
-- 7. SMART TICKET LOOKUP FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_registration(
  p_registration_number TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_phone TEXT;
  v_res RECORD;
BEGIN
  v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');

  SELECT 
    r.id,
    r.registration_number,
    r.full_name,
    r.skill_level,
    r.playing_category,
    r.payment_status,
    r.attendance_status,
    r.utr_reference,
    r.payment_screenshot_path,
    r.created_at,
    e.title as event_title,
    e.event_date,
    e.start_time,
    e.end_time,
    e.venue,
    e.registration_fee
  INTO v_res
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE (
    (p_registration_number IS NOT NULL AND trim(p_registration_number) != '' AND upper(trim(r.registration_number)) = upper(trim(p_registration_number)))
    OR
    (p_registration_number IS NULL OR trim(p_registration_number) = '')
  )
  AND (
    (v_clean_phone IS NOT NULL AND length(v_clean_phone) >= 10 AND (r.phone = v_clean_phone OR right(r.phone, 10) = right(v_clean_phone, 10)))
    OR
    (v_clean_phone IS NULL OR length(v_clean_phone) < 10)
  )
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'message', 'No matching registration found for this number and phone combination.'
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'registration', row_to_json(v_res)
  );
END;
$$;

-- --------------------------------------------------------------------
-- 8. REMAINING SLOTS FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_event_remaining_slots(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max INTEGER;
  v_booked INTEGER;
BEGIN
  SELECT max_participants INTO v_max 
  FROM public.events 
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_booked
  FROM public.registrations
  WHERE event_id = p_event_id 
    AND payment_status != 'rejected';

  RETURN GREATEST(0, v_max - v_booked);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.register_for_event TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_registration TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_remaining_slots TO anon, authenticated;

-- --------------------------------------------------------------------
-- 9. VERIFICATION QUERY (CONFIRM CLEAN PRODUCTION STATE)
-- --------------------------------------------------------------------
SELECT 
  'registrations' AS table_name, 
  COUNT(*)::text AS count 
FROM public.registrations
UNION ALL
SELECT 
  'published_events', 
  COUNT(*)::text 
FROM public.events 
WHERE status = 'published'
UNION ALL
SELECT 
  'payment_settings', 
  upi_id 
FROM public.payment_settings;
