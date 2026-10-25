import { supabaseClient } from "./supabaseClient";

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
let cachedSettings: ScoringSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get scoring settings from Supabase with fallback to localStorage/defaults
 * Caches results for 5 minutes to reduce database queries
 */
export async function getScoringSettingsAsync(): Promise<ScoringSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && now - lastFetchTime < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabaseClient
      .from("scoring_settings")
      .select("*");

    if (error) throw error;

    if (data && data.length > 0) {
      const settings: Partial<ScoringSettings> = {};
      
      data.forEach((row: any) => {
        const key = row.setting_key;
        if (key === "interest_level_eleve") {
          settings.interestLevelPoints = row.setting_value;
        } else if (key === "contact_person_confirmed") {
          settings.mainContactPoints = row.setting_value;
        } else if (key === "needs_identified") {
          settings.identifiedNeedsPoints = row.setting_value;
        } else if (key === "pain_points_entered") {
          settings.painPointsPerTag = row.setting_value;
        } else if (key === "open_for_appointment") {
          settings.openForAppointmentPoints = row.setting_value;
          settings.painPointsMax = row.setting_value; // Use same as max
        } else if (key === "open_for_appointment") {
          settings.callPerLog = row.setting_value;
          settings.callMax = row.setting_value * 3; // 3x multiplier for max
        }
      });

      cachedSettings = { ...DEFAULT_SCORING_SETTINGS, ...settings };
      lastFetchTime = now;
      return cachedSettings;
    }
  } catch (error) {
    console.warn("Failed to fetch scoring settings from Supabase, using defaults:", error);
  }

  // Fall back to localStorage or defaults
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedSettings = { ...DEFAULT_SCORING_SETTINGS, ...JSON.parse(stored) };
      lastFetchTime = now;
      return cachedSettings;
    }
  } catch {
    // ignore
  }

  cachedSettings = { ...DEFAULT_SCORING_SETTINGS };
  lastFetchTime = now;
  return cachedSettings;
}

/**
 * Synchronous version for immediate use - returns cached or default
 */
export function getScoringSettings(): ScoringSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SCORING_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }

  return { ...DEFAULT_SCORING_SETTINGS };
}

/**
 * Save settings to Supabase
 */
export async function saveScoringSettingsAsync(settings: ScoringSettings): Promise<void> {
  try {
    // Update multiple records in Supabase
    const updates = [
      { setting_key: "interest_level_eleve", setting_value: settings.interestLevelPoints },
      { setting_key: "contact_person_confirmed", setting_value: settings.mainContactPoints },
      { setting_key: "needs_identified", setting_value: settings.identifiedNeedsPoints },
      { setting_key: "pain_points_entered", setting_value: settings.painPointsPerTag },
      { setting_key: "open_for_appointment", setting_value: settings.openForAppointmentPoints },
    ];

    for (const update of updates) {
      await supabaseClient
        .from("scoring_settings")
        .upsert(update, { onConflict: "setting_key" });
    }

    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    
    // Clear cache to force refresh
    cachedSettings = null;
    lastFetchTime = 0;
  } catch (error) {
    console.error("Failed to save scoring settings:", error);
    throw error;
  }
}

export function saveScoringSettings(settings: ScoringSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  cachedSettings = null;
}

export function resetScoringSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
  cachedSettings = null;
}
