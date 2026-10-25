-- ============================================================================
-- Add Missing Columns to Appointments Table
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to add the missing columns

-- Add appointment_time column if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_time TIME;

-- Add appointment_type column if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type TEXT CHECK (appointment_type IN ('Téléphonique', 'Visio', 'Présentiel'));

-- Verify the columns were added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'appointments' AND (column_name = 'appointment_time' OR column_name = 'appointment_type');
