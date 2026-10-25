# Phase 6 - Supabase Integration Testing Guide

## Setup Complete ✅

**Option A: Database Schema** - DONE
- Created comprehensive SQL schema with all tables
- Includes relationships, constraints, and RLS policies
- Default scoring settings pre-populated
- Run `supabase-schema.sql` in your Supabase SQL Editor

**Option D: Scoring System** - DONE
- Updated scoring to fetch settings from Supabase 
- Added `saveQualificationToSupabase()` to persist lead qualification data
- Added `updateLeadScore()` to recalculate scores after call logs
- Scoring settings cached for 5 minutes to optimize performance
- Falls back to localStorage/defaults if Supabase unavailable

## What's Now Wired to Supabase

### Leads Table
- Lead qualification fields automatically save to Supabase
- Scores calculated and stored in Supabase
- All CRUD operations sync with database

### Call Logs Table  
- Call logs saved to Supabase
- Lead stage updated automatically
- Score recalculation triggered after new calls

### Appointments Table
- Full appointment data persisted
- Confirmation status and final status tracked
- Real-time relationships maintained

### Scoring Settings
- Configured in `scoring_settings` table
- Loaded async with fallback to defaults
- Can be managed per-organization

## Testing Steps

### Step 1: Create Supabase Schema
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase-schema.sql`
3. Verify all 6 tables created: `companies`, `contacts`, `leads`, `call_logs`, `appointments`, `scoring_settings`

### Step 2: Seed Initial Test Data (Optional)
Add some test records to the database:

```sql
-- Test Company
INSERT INTO companies (nom, siret, activite, adresse, code_postal, ville, telephone)
VALUES ('Test Corp', '12345678901234', 'Software', '123 Main St', '75001', 'Paris', '0123456789');

-- Test Contact
INSERT INTO contacts (civilite, nom, prenom, fonction, email, telephone_portable, company_id)
VALUES ('M.', 'Dupont', 'Jean', 'Manager', 'jean@testcorp.fr', '0612345678', 1);

-- Test Lead
INSERT INTO leads (nom, prenom, email, telephone_portable, stage, company_id, numero_unique)
VALUES ('Moreau', 'Claire', 'claire@corp.fr', '0687654321', 'qualified', 1, 'NU-001');
```

### Step 3: Start Dev Server
```bash
cd "c:\Users\Admin\OneDrive\Documents\EcommFox_Digital\sales-pipeline-crm-teleprospecting-tool"
npm run dev
```

The app loads on **localhost:5174** (or next available port)

### Step 4: Test Leads Page
1. Navigate to **Leads** → **Leads Table**
2. Check that leads load (initially empty, or from seed data)
3. Try creating a new lead - should appear in both app AND Supabase

### Step 5: Test Qualified Leads + Scoring
1. Navigate to **Leads qualifiés**
2. Find a qualified lead or change a lead's stage to "qualified"
3. Open qualification drawer (expand row or click button)
4. Fill qualification fields:
   - Intérêt: Select "Élevé"
   - Pain Points: Select 2-3 items
   - Besoins: Enter something
   - Contact: Select from dropdown
   - Ouvert RDV: Toggle yes
5. Click "Enregistrer"
6. Verify score updates ✅

**Check in Supabase:**
- Go to `leads` table
- Find your lead
- Verify `score` field is NOT NULL
- Verify `interest_level`, `pain_points`, `identified_needs`, etc. are populated

### Step 6: Test Appointments + Calendar
1. Navigate to **Rendez-vous Confirmés**
2. Should display leads with appointments from Supabase
3. Try "Mark as Confirmed" on an appointment
4. Verify status changes in table AND in Supabase `appointments.final_status`
5. Check that lead's stage updated to "confirmed"

**Check in Supabase:**
- Go to `appointments` table
- Verify `final_status` is "Confirmé" or "Perdu"
- Verify linked `lead_id` and `contact_id` exist

### Step 7: Test Call Logging
1. Go to a lead detail page
2. Click "Log a Call"
3. Fill the form and submit
4. Verify call log appears in history

**Check in Supabase:**
- Go to `call_logs` table  
- Verify new call log created with correct `lead_id`
- Check that lead's `stage` updated to match `statut_lead`
- Verify lead `score` recalculated

### Step 8: Test Dashboard + Analytics
1. Navigate to **Tableau de bord**
2. Verify KPI cards show correct totals
3. Charts should display data from Supabase
4. Navigate to **Analytics**
5. Try date range filters
6. Verify all charts update

## Debugging

### Issue: "Cannot read property 'data' of undefined"
**Solution**: Check `.env.local` has correct Supabase credentials

### Issue: 401 Unauthorized errors
**Solution**: Verify RLS policies are enabled and allow authenticated users. Run the RLS setup from `supabase-schema.sql`

### Issue: Slow performance
**Solution**: Scoring caches results for 5 minutes. Clear cache if needed for immediate updates:
```typescript
// In browser console
localStorage.removeItem('crm-scoring-settings')
```

### Issue: Data not appearing
**Solution**: 
1. Verify table exists in Supabase
2. Check data was inserted correctly
3. Review browser console for errors
4. Check network tab to see Supabase API calls

## Summary

✅ **Supabase schema created with all required tables**
✅ **Scoring system integrated with Supabase**  
✅ **Qualification data saves to database**
✅ **Scores auto-calculated and persisted**
✅ **Appointment tracking fully functional**
✅ **Fall-back to defaults if Supabase unavailable**

## Next Steps

- **Option B**: CSV/Excel import for bulk lead data
- **Option C**: Real-time subscriptions for live updates across users
- Polish and production deployment
