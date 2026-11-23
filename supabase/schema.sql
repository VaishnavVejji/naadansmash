-- ====================================================================
-- NAADANSMASH — Production Database Schema (PostgreSQL / Supabase)
-- Project Ref: odnjkvxqypjklsjgxpoj
-- ====================================================================

-- Enable pgcrypto for UUID and random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. EVENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue TEXT NOT NULL,
  registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
  max_participants INTEGER NOT NULL DEFAULT 24,
  registration_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events (status, event_date);

-- --------------------------------------------------------------------
-- 2. REGISTRATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced')),
  playing_category TEXT NOT NULL DEFAULT 'Open Doubles',
  emergency_contact TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  attendance_status TEXT NOT NULL DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'present', 'absent')),
  utr_reference TEXT,
  payment_screenshot_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event_phone UNIQUE (event_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.registrations (phone);
CREATE INDEX IF NOT EXISTS idx_registrations_number ON public.registrations (registration_number);

-- --------------------------------------------------------------------
-- 3. PROFILES TABLE (Supabase Auth Users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. PAYMENT SETTINGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id TEXT NOT NULL,
  qr_image_path TEXT,
  account_display_name TEXT NOT NULL,
  payment_instructions TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. CONTACT INQUIRIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_or_phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Public can submit contact inquiries" ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view contact inquiries" ON public.contact_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')
    )
  );

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events" ON public.events
  FOR SELECT
  USING (status IN ('published', 'completed'));

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.registrations;
CREATE POLICY "Admins can manage all registrations" ON public.registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')
    )
  );

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Public can view payment settings" ON public.payment_settings;
CREATE POLICY "Public can view payment settings" ON public.payment_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can edit payment settings" ON public.payment_settings;
CREATE POLICY "Admins can edit payment settings" ON public.payment_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- --------------------------------------------------------------------
-- HELPER: GET REMAINING SLOTS
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

GRANT EXECUTE ON FUNCTION public.get_event_remaining_slots(UUID) TO anon, authenticated;

-- --------------------------------------------------------------------
-- ATOMIC REGISTRATION TRANSACTION (SECURITY DEFINER)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_skill_level TEXT,
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
  v_duplicate_count INTEGER;
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

  -- 5. Prevent duplicate registrations for same event & phone number
  SELECT COUNT(*) INTO v_duplicate_count
  FROM public.registrations
  WHERE event_id = p_event_id
    AND phone = v_clean_phone
    AND payment_status != 'rejected';

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_REGISTRATION',
      'message', 'A registration with this phone number is already active for this session.'
    );
  END IF;

  -- 6. Generate unique registration number (NS-YYMM-XXXXXX)
  v_reg_number := 'NS-' || to_char(NOW(), 'YYMM') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  -- 7. Insert the registration atomically
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
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_REGISTRATION',
      'message', 'This phone number is already registered for this event.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TRANSACTION_ERROR',
      'message', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_event TO anon, authenticated;

-- --------------------------------------------------------------------
-- SECURE LOOKUP: ALLOW USER TO VIEW THEIR OWN CONFIRMATION
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
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');

  SELECT 
    r.id,
    r.registration_number,
    r.full_name,
    r.skill_level,
    r.playing_category,
    r.payment_status,
    r.attendance_status,
    r.utr_reference,
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
  WHERE upper(trim(r.registration_number)) = upper(trim(p_registration_number))
    AND (
      r.phone = v_clean_phone OR 
      right(r.phone, 10) = right(v_clean_phone, 10)
    );

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

GRANT EXECUTE ON FUNCTION public.lookup_registration TO anon, authenticated;

-- --------------------------------------------------------------------
-- SEED INITIAL DATA
-- --------------------------------------------------------------------
INSERT INTO public.payment_settings (
  id,
  upi_id,
  qr_image_path,
  account_display_name,
  payment_instructions
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'naadansmash@upi',
  '/images/naadansmash-logo.png',
  'NAADANSMASH Kochi Sports Club',
  'Transfer ₹250 via GPay, PhonePe, or Paytm to naadansmash@upi. Enter the 12-digit UTR reference number upon registration to expedite court check-in.'
) ON CONFLICT (id) DO UPDATE SET
  upi_id = EXCLUDED.upi_id,
  account_display_name = EXCLUDED.account_display_name;

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
) ON CONFLICT (id) DO NOTHING;

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
  'Weekend Evening Smash — Session #2',
  'Weekend evening badminton meetup session. 3 hours of structured doubles rotations paired by skill level with refreshments included.',
  '2026-11-29',
  '17:30:00',
  '20:30:00',
  'Flymate Badminton Hub, Kakkanad, Kochi',
  250.00,
  24,
  '2026-11-29 16:00:00+05:30',
  'published'
) ON CONFLICT (id) DO NOTHING;
