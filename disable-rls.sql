-- ============================================================================
-- Disable Row Level Security for Development
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to allow unauthenticated access
-- to all tables (for MVP development only)

-- Remove RLS from all tables
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users all operations" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users all operations" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated users all operations" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users all operations" ON call_logs;
DROP POLICY IF EXISTS "Allow authenticated users all operations" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated users read scoring settings" ON scoring_settings;
