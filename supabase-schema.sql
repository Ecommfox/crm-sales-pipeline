-- ============================================================================
-- Supabase Schema for CRM Teleprospecting Tool
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to create the database schema

-- ─── Companies Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  siret TEXT UNIQUE,
  activite TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Contacts Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  civilite TEXT,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  fonction TEXT,
  email TEXT,
  telephone_portable TEXT,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Leads Table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  -- Basic Info
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  civilite TEXT,
  fonction TEXT,
  -- Contact Info
  email TEXT,
  telephone_fixe TEXT,
  telephone_portable TEXT,
  -- Address
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  -- Company Reference
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  -- Company Details (denormalized)
  siret TEXT,
  activite TEXT,
  -- Call Info
  numero_unique TEXT UNIQUE,
  teleoperateur TEXT,
  date_appel TIMESTAMP WITH TIME ZONE,
  etat_appel TEXT,
  commentaire TEXT,
  -- Stage & Status
  stage TEXT DEFAULT 'none' CHECK (stage IN ('none', 'pre-qualified', 'qualified', 'pre-scheduled', 'confirmed')),
  -- Qualification Fields
  interest_level TEXT CHECK (interest_level IS NULL OR interest_level IN ('Faible', 'Moyen', 'Élevé')),
  pain_points TEXT[], -- JSON array stored as PostgreSQL array
  identified_needs TEXT,
  open_for_appointment BOOLEAN,
  -- Scoring
  score INTEGER,
  -- Main Contact Reference
  main_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Call Logs Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS call_logs (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  resultat TEXT NOT NULL,
  type_appel TEXT,
  statut_lead TEXT CHECK (statut_lead IN ('none', 'pre-qualified', 'qualified', 'pre-scheduled', 'confirmed')),
  commentaire TEXT,
  teleoperateur TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Appointments Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  appointment_time TIME,
  appointment_type TEXT CHECK (appointment_type IN ('Téléphonique', 'Visio', 'Présentiel')),
  email_subject TEXT,
  email_context TEXT,
  notes TEXT,
  call_recording_url TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  final_status TEXT CHECK (final_status IS NULL OR final_status IN ('Confirmé', 'Perdu', 'Planifié')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Scoring Settings Table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scoring_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initialize default scoring settings
INSERT INTO scoring_settings (setting_key, setting_value, description) VALUES
  ('qualification_question_answered', 15, 'Points pour chaque question de qualification répondue'),
  ('contact_person_confirmed', 20, 'Points pour contact confirmé'),
  ('needs_identified', 15, 'Points pour besoins identifiés'),
  ('pain_points_entered', 10, 'Points par pain point renseigné'),
  ('open_for_appointment', 25, 'Points si ouvert pour RDV'),
  ('interest_level_faible', 0, 'Points pour niveau d''intérêt faible'),
  ('interest_level_moyen', 25, 'Points pour niveau d''intérêt moyen'),
  ('interest_level_eleve', 50, 'Points pour niveau d''intérêt élevé')
ON CONFLICT (setting_key) DO NOTHING;

-- ─── Indexes for Performance ─────────────────────────────────────────────

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_main_contact_id ON leads(main_contact_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);

-- ─── Enable Row Level Security (RLS) ──────────────────────────────────────

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users full access (for MVP)
-- In production, implement more granular policies

CREATE POLICY "Allow authenticated users all operations" ON companies
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users all operations" ON contacts
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users all operations" ON leads
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users all operations" ON call_logs
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users all operations" ON appointments
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users read scoring settings" ON scoring_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');
