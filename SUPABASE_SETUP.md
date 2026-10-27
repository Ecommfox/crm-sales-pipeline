# Supabase Setup Instructions

## Step 1: Create the Database Schema

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project (odvtdiuazvrsersnsbug)
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run** to execute

This will create all required tables with proper relationships and indexes.

## Step 2: Apply the Account and Access Migration

The app expects the existing `user_profiles`, `audit_logs`, and `pending_invitations`
tables. Verify these tables before running `admin-access-migration.sql`; the migration
does not recreate them. Run that migration in the Supabase SQL Editor to repair the
recursive `user_profiles` RLS policy, securely handle invitation tokens, create new
profiles with the viewer role, add role-based settings access, and associate new call
logs with their authenticated user.

The migration intentionally replaces policies on `user_profiles` and
`pending_invitations`. It does not modify `audit_logs` or the policies on CRM data tables.

## Step 3: Configure RLS (Row Level Security)

The SQL script includes basic RLS policies. For production, consider:
- Enabling multi-tenancy
- Adding user-based access controls
- Restricting scoring settings to admin-only

## Step 4: Configure Password Reset Email

In **Authentication → URL Configuration**, add the deployed app's `/reset-password`
URL and the local development callback (for example,
`http://localhost:5173/reset-password`) to the allowed redirect URLs.

Supabase Auth sends reset emails through its default sender when custom SMTP is not
configured. For production delivery, configure a verified sender address and SMTP
credentials under **Authentication → SMTP Settings**, then review the password-reset
email template under **Authentication → Email Templates**. Keep SMTP credentials in
the Supabase dashboard; do not put them in `.env.local` or client code.

## Step 5: Test the Connection

The app will automatically use Supabase when you run `npm run dev`:
- It uses the credentials in `.env.local`
- The data provider in `src/providers/data.ts` handles field mapping
- All CRUD operations automatically translate between TypeScript and Supabase column names

## Column Mappings Reference

### Leads Table
- `nom` (DB) ← `societe` (TS) - Company name
- `company_id` - Reference to companies table
- `email` (DB) ← `mail` (TS)
- `telephone_fixe/telephone_portable` - Phone numbers
- `stage` - 'none', 'pre-qualified', 'qualified', 'pre-scheduled', 'confirmed'
- `interest_level` - Faible, Moyen, Élevé
- `pain_points` - PostgreSQL text array
- `score` - Calculated score

### Call Logs Table
- `resultat` (DB) ← `callResult` (TS)
- `type_appel` (DB) ← `callType` (TS)
- `statut_lead` (DB) ← `leadStatusAfter` (TS)
- `teleoperateur` (DB) ← `teleoperator` (TS)

### Appointments Table
- `scheduled_date` (DB) ← `appointmentDate` (TS)
- `appointment_time` (DB) ← `appointmentTime` (TS)
- `appointment_type` (DB) ← `appointmentType` (TS)
- `email_context` (DB) ← `emailBody` (TS)
- `call_recording_url` (DB) ← `callRecordingUrl` (TS)
- `final_status` (DB) ← `finalStatus` (TS)

## Verification

After schema creation, verify tables exist:
1. In Supabase, go to **Table Editor**
2. You should see: `companies`, `contacts`, `leads`, `call_logs`, `appointments`, `scoring_settings`
3. Click each table to verify columns match the schema

## Next Steps

- Option D: Wire scoring calculations
- Option B: Add CSV import
- Option C: Add real-time subscriptions
