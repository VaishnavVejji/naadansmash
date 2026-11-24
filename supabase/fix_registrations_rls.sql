-- ====================================================================
-- NAADANSMASH: FULL SUPABASE SYNC & REGISTRATIONS FIX
-- ====================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/odnjkvxqypjklsjgxpoj/sql/new

-- 1. Enable Full Access for anon and authenticated users on public.registrations
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

-- 2. Drop the duplicate phone constraint so each registration gets a brand-new ID
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS unique_event_phone;

-- 3. Clear all old demo registrations so sessions start completely fresh
DELETE FROM public.registrations;

-- 4. Reset Event #2 to published and ensure 24 slots available
UPDATE public.events 
SET status = 'published', max_participants = 24 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 5. Verification query to confirm 0 registrations and open event
SELECT id, title, status, max_participants FROM public.events WHERE status = 'published';
SELECT COUNT(*) as total_registrations FROM public.registrations;
