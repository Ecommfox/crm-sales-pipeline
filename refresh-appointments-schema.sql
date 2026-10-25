-- ============================================================================
-- Refresh Appointments Table Schema
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor if you encounter schema cache errors
-- "Could not find the 'appointment_type' column of 'appointments'"

-- This script refreshes the appointments table and ensures all columns exist

-- Step 1: Check if table exists and columns are correct
-- (If getting column not found errors, this ensures they exist)

ALTER TABLE IF EXISTS appointments
ADD COLUMN IF NOT EXISTS appointment_type TEXT CHECK (appointment_type IN ('Téléphonique', 'Visio', 'Présentiel'));

ALTER TABLE IF EXISTS appointments
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE;

-- Step 2: Ensure NOT NULL constraint on required fields
ALTER TABLE IF EXISTS appointments
ALTER COLUMN scheduled_date SET NOT NULL;

-- Step 3: Verify all indexes exist
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);

-- Step 4: Clear schema introspection cache (this happens automatically after a few seconds,
-- but you may need to refresh your browser or reconnect to see changes)

-- If the error persists, try:
-- 1. Restart your development server (npm run dev)
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. In Supabase dashboard: Settings → Database → Refresh Schema Cache
