-- ============================================================================
-- Add Missing company_id Column to Appointments Table (UUID type)
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to add the missing column

-- Add company_id column as UUID if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'appointments' AND column_name = 'company_id';
