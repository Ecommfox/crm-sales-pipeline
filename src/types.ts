export type Stage = "none" | "pre-qualified" | "qualified" | "pre-scheduled" | "confirmed";

export type CallResult =
  | "Ignoré"
  | "Répondeur"
  | "Barrage secrétaire"
  | "Non décroché"
  | "Non appelé"
  | "Numéro non attribué"
  | "Liste noire"
  | "Positif"
  | "Negatif";

export type CallType = "Normal" | "Qualification" | "Rappel" | "Rendez-vous" | "Relance" | "Closing";

export type InterestLevel = "Faible" | "Moyen" | "Élevé";

export interface Lead {
  id: number;
  societe: string;
  siret: string;
  activite: string;
  civilite: string;
  nom: string;
  prenom: string;
  fonction: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephoneFixe: string;
  telephonePortable: string;
  mail: string;
  dateHeureAppel: string | null;
  etatAppel: CallResult | null;
  commentaireTeleoperateur: string | null;
  numeroUnique: string;
  teleoperateurAppel: string | null;
  stage: Stage;
  companyId: string | null;
  archived?: boolean;
  // Qualification fields (Phase 2)
  interestLevel?: InterestLevel | null;
  painPoints?: string[];
  identifiedNeeds?: string | null;
  openForAppointment?: boolean | null;
  mainContactId?: string | null;
  score?: number | null;
}

export interface Company {
  id: string;
  societe: string;
  siret: string;
  activite: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
}

export interface Contact {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  fonction: string;
  mail: string;
  telephonePortable: string;
  companyId: string;
}

export interface CallLog {
  id: number;
  leadId: number;
  date: string;
  callResult: CallResult;
  callType: CallType;
  leadStatusAfter: Stage;
  comment: string;
  teleoperator: string;
}

export type AppointmentType = "Téléphonique" | "Visio" | "Présentiel";

export type FinalStatus = "Confirmé" | "Perdu" | "Planifié";

export interface Appointment {
  id: number;
  leadId: number;
  companyId: string | null;
  contactId: string | null;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  emailSent?: boolean;
  notes?: string;
  callRecordingUrl?: string | null;
  createdAt?: string;
  confirmed?: boolean;
  finalStatus?: FinalStatus;
}

// ─── Role-Based Access Control ──────────────────────────────────────
export type UserRole = "admin" | "manager" | "teleoperator" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  created_at: string;
}

// ─── System Settings ────────────────────────────────────────────────
export interface ScoringSettings {
  id: number;
  setting_key: string;
  setting_value: number;
  description: string;
  created_at: string;
  updated_at: string;
}

// ─── Pending Invitations ────────────────────────────────────────────
export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";

export interface PendingInvitation {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at?: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
}
