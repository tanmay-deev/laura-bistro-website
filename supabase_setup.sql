-- ==============================================================================
-- L'AURA BISTRO & BAR - SUPABASE DATABASE SCHEMA & POLICIES
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click on "SQL Editor" in the left sidebar (icon with '>_')
-- 4. Click "New query", paste all the SQL code below, and click "Run" (or Ctrl+Enter)
-- ==============================================================================

-- 1. Create the reservations table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    guests INTEGER NOT NULL DEFAULT 2,
    occasion TEXT DEFAULT 'General Dining',
    special_requests TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. Safely drop existing policies before recreating to avoid duplicate errors
DROP POLICY IF EXISTS "Allow public visitors to insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated staff to view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated staff to update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated staff to delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow staff to view all reservations" ON public.reservations;

-- 4. Policy: Allow anyone (website visitors) to submit a new table reservation
CREATE POLICY "Allow public visitors to insert reservations" 
ON public.reservations 
FOR INSERT 
TO public
WITH CHECK (true);

-- 5. Policy: Allow viewing reservations
CREATE POLICY "Allow staff to view all reservations" 
ON public.reservations 
FOR SELECT 
TO public 
USING (true);

-- 6. Policy: Allow updating reservations (status change)
CREATE POLICY "Allow staff to update reservations" 
ON public.reservations 
FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- 7. Policy: Allow deleting reservations
CREATE POLICY "Allow staff to delete reservations" 
ON public.reservations 
FOR DELETE 
TO public 
USING (true);

-- ==============================================================================
-- 8. SAMPLE DATA (Initial rows so your dashboard looks great immediately)
-- ==============================================================================
INSERT INTO public.reservations (customer_name, customer_phone, customer_email, booking_date, booking_time, guests, occasion, special_requests, status)
VALUES 
('Sophia Laurent', '+1 (555) 234-5678', 'sophia@example.com', CURRENT_DATE + INTERVAL '1 day', '7:30 PM', 2, 'Anniversary', 'Window seating if possible please', 'confirmed'),
('Marcus Sterling', '+1 (555) 987-6543', 'marcus@example.com', CURRENT_DATE + INTERVAL '2 days', '8:00 PM', 4, 'Birthday', 'Vegan options preferred for 2 guests', 'pending');
