export type Stage = "none" | "pre-qualified" | "qualified" | "pre-scheduled" | "confirmed";

export type CallResult =
  | "Ignoré"
  | "Répondeur"
  | "Barrage secrétaire"
  | "Non décroché"
  | "Non appelé"
  | "Numéro non attribué"
  | "Liste noire";

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
  companyId: number | null;
  // Qualification fields (Phase 2)
  interestLevel?: InterestLevel | null;
  painPoints?: string[];
  identifiedNeeds?: string | null;
  openForAppointment?: boolean | null;
  mainContactId?: number | null;
  score?: number | null;
}

export interface Company {
  id: number;
  societe: string;
  siret: string;
  activite: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
}

export interface Contact {
  id: number;
  civilite: string;
  nom: string;
  prenom: string;
  fonction: string;
  mail: string;
  telephonePortable: string;
  companyId: number;
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

export interface Appointment {
  id: number;
  leadId: number;
  companyId: number | null;
  contactId: number | null;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  emailSubject: string;
  emailBody: string;
  notes: string;
  callRecordingUrl: string | null;
  createdAt: string;
}
