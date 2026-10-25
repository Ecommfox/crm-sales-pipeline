# Supabase Setup Instructions

## Step 1: Create the Database Schema

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project (odvtdiuazvrsersnsbug)
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run** to execute

This will create all required tables with proper relationships and indexes.

## Step 2: Configure RLS (Row Level Security)

The SQL script includes basic RLS policies. For production, consider:
- Enabling multi-tenancy
- Adding user-based access controls
- Restricting scoring settings to admin-only

## Step 3: Test the Connection

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
