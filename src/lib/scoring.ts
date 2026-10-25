import { getScoringSettings } from "./scoring-settings";
import { supabaseClient } from "./supabaseClient";

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

/**
 * Save lead qualification data to Supabase
 */
export async function saveQualificationToSupabase(
  leadId: number,
  qual: QualificationData
): Promise<void> {
  try {
    // Calculate score based on qualification
    const { data: callLogs } = await supabaseClient
      .from("call_logs")
      .select("id", { count: "exact" })
      .eq("lead_id", leadId);

    const callCount = callLogs?.length ?? 0;
    const score = calculateScore(qual, callCount);

    // Update lead in Supabase
    const { error } = await supabaseClient
      .from("leads")
      .update({
        interest_level: qual.interestLevel || null,
        pain_points: qual.painPoints && qual.painPoints.length > 0 ? qual.painPoints : null,
        identified_needs: qual.identifiedNeeds || null,
        open_for_appointment: qual.openForAppointment,
        main_contact_id: qual.mainContactId || null,
        score: score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) throw error;

    // Also save to localStorage for offline access
    const map = getQualificationMap();
    map[leadId] = qual;
    saveQualificationMap(map);
  } catch (error) {
    console.error("Failed to save qualification to Supabase:", error);
    throw error;
  }
}

/**
 * Update lead score in Supabase (called after call logs are saved)
 */
export async function updateLeadScore(leadId: number): Promise<number> {
  try {
    // Get the lead with all qualification data
    const { data: leadData, error: leadError } = await supabaseClient
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError) throw leadError;

    if (!leadData) {
      console.warn(`Lead ${leadId} not found`);
      return 0;
    }

    // Get call logs for this lead
    const { data: callLogs, error: callError } = await supabaseClient
      .from("call_logs")
      .select("id", { count: "exact" })
      .eq("lead_id", leadId);

    if (callError) throw callError;

    // Build qualification from lead data
    const qual: QualificationData = {
      interestLevel: leadData.interest_level || "",
      painPoints: leadData.pain_points || [],
      identifiedNeeds: leadData.identified_needs || "",
      openForAppointment: leadData.open_for_appointment,
      mainContactId: leadData.main_contact_id?.toString() || "",
    };

    // Calculate new score
    const callCount = callLogs?.length ?? 0;
    const newScore = calculateScore(qual, callCount);

    // Update score in Supabase
    const { error: updateError } = await supabaseClient
      .from("leads")
      .update({
        score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateError) throw updateError;

    return newScore;
  } catch (error) {
    console.error("Failed to update lead score:", error);
    throw error;
  }
}

export function getScoreStyle(score: number): { className: string; ring: string } {
  if (score <= 20) return { className: "bg-gray-100 text-gray-600 border-gray-300", ring: "ring-gray-300" };
  if (score <= 50) return { className: "bg-yellow-100 text-yellow-700 border-yellow-300", ring: "ring-yellow-300" };
  if (score <= 80) return { className: "bg-orange-100 text-orange-700 border-orange-300", ring: "ring-orange-300" };
  return { className: "bg-green-100 text-green-700 border-green-300", ring: "ring-green-300" };
}
