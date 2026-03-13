# Project: Sales Pipeline CRM — Teleprospecting Tool

## Overview

A CRM built for sales teams handling outbound phone prospecting. Operators call leads, qualify them through conversation, log call outcomes, score leads, and schedule appointments. Leads progress through defined stages (none → pre-qualified → qualified → pre-scheduled → confirmed appointment) with full call history and scoring automation.

---

<phase number="1" title="Leads Table + Call Logging Core">

Deliver a functional Leads list table with full columns, stage badges, and a call logging modal — the heart of the daily operator workflow.

#### Key Features

- Full Leads table with all defined columns and stage badges
- Filter by stage, call status, and "uncontacted" leads
- Log a call per lead: result, type, mandatory status update
- Lead detail page (Salesforce-inspired layout) with all field details
- Mock data pre-populated with realistic French prospect data

#### Tasks

- [x] Set up mock data: leads (with all columns), companies, contacts, call logs — with stage variety
- [x] Build Leads list table with all columns: Société, Siret, Activité, Civilité, Nom, Prénom, Fonction, Adresse, Code Postal, Ville, Téléphone fixe, Téléphone portable, Mail, Date/heure appel, État appel, Commentaire téléopérateur, Numéro unique, Téléopérateur appel — with column visibility toggles and stage badge
- [x] Add "Log a Call" modal per lead row: call result dropdown (Ignoré, Répondeur, Barrage secrétaire, Non décroché, Non appelé, Numéro non attribué, Liste noire), call type (Normal, Qualification, Rappel, Rendez-vous, Relance, Closing), mandatory lead status update, comment field
- [x] Build Lead detail page (Salesforce-inspired layout): full fields in sections, call log history timeline, stage indicator, action buttons (Log Call, Edit, Schedule)
- [x] Add "Uncontacted" quick filter and filter panel (by stage, état appel, ville, activité)

#### Notes

- Data source: Mock data (default) — Supabase integration in final phase
- Stages: `none`, `pre-qualified`, `qualified`, `pre-scheduled`, `confirmed`
- Status from call log drives where the lead moves in the pipeline
- French field labels throughout the UI

</phase>

---

<phase number="2" title="Qualified Leads Table + Lead Scoring">

Qualified Leads table (only `qualified` stage leads) with enriched columns, scoring system, and qualification criteria inputs.

#### Tasks

- [x] Build Qualified Leads table: all Leads columns + Interest Level, Pain Points (multi-tag), Identified Needs, Open for Appointment (yes/no), Main Contact (from linked company contacts)
- [x] Add inline qualification form per row: expandable panel or side drawer to fill qualification fields and save
- [x] Implement Lead Scoring display: score badge per lead calculated from weighted criteria (qualification questions answered, contact confirmed, needs identified, pain points count, open for appointment)
- [x] Build Settings page: define scoring rules — points per action (qualification question answered, contact person confirmed, needs identified, pain points entered, open for appointment flagged, other custom inputs)
- [x] Add "Schedule Appointment" modal: select date/time, main contact, add email details, notes, call recording link or file upload (optional), links to lead and company
- [x] Add "Add Contact" quick action per lead: create a new contact linked to the lead's company directly from the table row

</phase>

---

<phase number="3" title="Confirmed Appointments Table + Calendar">

Confirmed Appointments view (pre-scheduled + confirmed stage leads) with appointment tracking columns, plus Calendar view.

#### Tasks

- [ ] Build Confirmed Appointments table with columns: Main Contact (last name + first name), Interest Level, Scoring Level, Appointment Scheduled (yes/no), Scheduled Date + Confirmed checkbox, Reminders (linked call logs), Final Status (Confirmed, Lost)
- [ ] Filter Confirmed Appointments table to only show leads with `pre-scheduled` or `confirmed` stage
- [ ] Add "Mark as Confirmed" and "Mark as Lost" quick actions per row
- [ ] Build Calendar page: monthly/weekly view showing scheduled appointments, color-coded by Final Status, click appointment to open lead detail
- [ ] Add reminder logging: link a reminder call log to an appointment from the Confirmed Appointments table

</phase>

---

<phase number="4" title="Dashboard + Analytics">

Dashboard with KPIs and lead pipeline overview; full Analytics page with charts and performance metrics.

#### Tasks

- [ ] Build Dashboard: KPI cards — Total Leads by Stage (funnel), Today's Calls, Calls per Minute, Average Call Duration, Qualification Rate (%), Appointment Confirmed Rate vs. Calls
- [ ] Add lead pipeline funnel chart: all leads sorted and visualized by stage
- [ ] Add Dashboard per-operator performance section: calls made, leads qualified, appointments booked per teleoperator
- [ ] Build Analytics page: date-range filterable charts — calls over time, lead stage transitions, scoring distribution, appointment conversion funnel
- [ ] Add custom KPI configuration: user can show/hide KPI cards on the Dashboard

</phase>

---

<phase number="5" title="Companies + Contacts Pages">

Standalone Companies and Contacts list pages with CRUD and relationship linking.

#### Tasks

- [x] Build Companies list table: Société, Siret, Activité, Adresse, Code Postal, Ville, Téléphone, number of linked contacts, number of linked leads — with filters
- [x] Company detail page: info fields, linked contacts list, linked leads list, call history
- [x] Build Contacts list table: Civilité, Nom, Prénom, Fonction, Mail, Téléphone portable, linked company, linked lead — with filters
- [x] Add/Edit Contact form: all fields + company selector (search/link existing company)
- [x] Add/Edit Company form: all fields + ability to add contacts inline

</phase>

---

<phase number="6" title="Supabase Integration + Production Data">

Replace mock data with live Supabase database, import existing prospect data, and wire all CRUD operations to real tables.

#### Tasks

- [ ] Connect Supabase and map database schema to all existing data types (leads, companies, contacts, call logs, appointments)
- [ ] Replace all mock data providers with Supabase data hooks
- [ ] Add CSV/Excel import for leads (map columns from the prospect file format defined in requirements)
- [ ] Wire call log creation, lead stage updates, scoring calculations to Supabase
- [ ] Add real-time updates: lead stage changes and new call logs reflect live across users

</phase>
