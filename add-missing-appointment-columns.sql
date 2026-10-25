-- ============================================================================
-- Add Missing Columns to Appointments Table
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to add the missing columns

-- Add emailSent column if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Add notes column if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add callRecordingUrl column if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS call_recording_url TEXT;

-- Drop old email columns if they exist (only if you want to clean up)
-- ALTER TABLE appointments DROP COLUMN IF EXISTS email_subject;
-- ALTER TABLE appointments DROP COLUMN IF EXISTS email_context;

-- Verify the columns were added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'appointments' 
-- AND column_name IN ('email_sent', 'notes', 'call_recording_url');
