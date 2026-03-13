export interface ScoringSettings {
  interestLevelPoints: number;
  mainContactPoints: number;
  identifiedNeedsPoints: number;
  painPointsPerTag: number;
  painPointsMax: number;
  openForAppointmentPoints: number;
  callPerLog: number;
  callMax: number;
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  interestLevelPoints: 10,
  mainContactPoints: 15,
  identifiedNeedsPoints: 10,
  painPointsPerTag: 5,
  painPointsMax: 20,
  openForAppointmentPoints: 25,
  callPerLog: 5,
  callMax: 15,
};

const STORAGE_KEY = "crm-scoring-settings";

export function getScoringSettings(): ScoringSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SCORING_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SCORING_SETTINGS };
}

export function saveScoringSettings(settings: ScoringSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetScoringSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}
