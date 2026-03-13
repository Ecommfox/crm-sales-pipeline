import { getScoringSettings } from "./scoring-settings";

export interface QualificationData {
  interestLevel: string;
  painPoints: string[];
  identifiedNeeds: string;
  openForAppointment: boolean | null;
  mainContactId: string;
}

export type QualificationMap = Record<number, QualificationData>;

const QUALIFICATION_STORAGE_KEY = "crm-qualification-map";

export function getQualificationMap(): QualificationMap {
  try {
    const stored = localStorage.getItem(QUALIFICATION_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return {};
}

export function saveQualificationMap(map: QualificationMap): void {
  localStorage.setItem(QUALIFICATION_STORAGE_KEY, JSON.stringify(map));
}

export function getQualData(leadId: number, map?: QualificationMap): QualificationData {
  const m = map ?? getQualificationMap();
  return (
    m[leadId] ?? {
      interestLevel: "",
      painPoints: [],
      identifiedNeeds: "",
      openForAppointment: null,
      mainContactId: "",
    }
  );
}

export function calculateScore(qual: QualificationData, callCount: number): number {
  const s = getScoringSettings();
  let score = 0;
  if (qual.interestLevel) score += s.interestLevelPoints;
  if (qual.mainContactId) score += s.mainContactPoints;
  if (qual.identifiedNeeds?.trim()) score += s.identifiedNeedsPoints;
  score += Math.min((qual.painPoints?.length ?? 0) * s.painPointsPerTag, s.painPointsMax);
  if (qual.openForAppointment === true) score += s.openForAppointmentPoints;
  score += Math.min(callCount * s.callPerLog, s.callMax);
  return score;
}

export function getScoreStyle(score: number): { className: string; ring: string } {
  if (score <= 20) return { className: "bg-gray-100 text-gray-600 border-gray-300", ring: "ring-gray-300" };
  if (score <= 50) return { className: "bg-yellow-100 text-yellow-700 border-yellow-300", ring: "ring-yellow-300" };
  if (score <= 80) return { className: "bg-orange-100 text-orange-700 border-orange-300", ring: "ring-orange-300" };
  return { className: "bg-green-100 text-green-700 border-green-300", ring: "ring-green-300" };
}
