// src/lib/invitationService.ts
import { supabaseClient } from "./supabaseClient";
import { logActivity } from "./auditLogger";
import type { PendingInvitation, UserRole } from "@/types";

/**
 * Generate a secure random token for invitations
 */
function generateToken(): string {
  return crypto.getRandomValues(new Uint8Array(32))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "");
}

/**
 * Create a pending invitation
 */
export async function createInvitation(
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<PendingInvitation | null> {
  try {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data, error } = await supabaseClient
      .from("pending_invitations")
      .insert([
        {
          email,
          token,
          role,
          invited_by: invitedBy,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log the invitation
    await logActivity({
      action: "create",
      resource_type: "user",
      details: `User invitation sent to ${email} with role ${role}`,
    });

    return data || null;
  } catch (err: any) {
    console.error("Error creating invitation:", err);
    throw err;
  }
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  token: string
): Promise<PendingInvitation | null> {
  const { data, error } = await supabaseClient.rpc("get_pending_invitation_by_token", {
    p_token: token,
  });
  if (error) throw error;
  return (data?.[0] as PendingInvitation | undefined) ?? null;
}

/**
 * Mark invitation as accepted
 */
export async function acceptInvitation(token: string): Promise<boolean> {
  const { error } = await supabaseClient.rpc("complete_pending_invitation", {
    p_token: token,
  });
  if (error) throw error;
  return true;
}

/**
 * Get all pending invitations for admin view
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  try {
    const { data, error } = await supabaseClient
      .from("pending_invitations")
      .select("*")
      .eq("status", "pending")
      .order("invited_at", { ascending: false });

    if (error) throw error;

    // Filter out expired invitations
    const now = new Date();
    return (data || []).filter((inv) => new Date(inv.expires_at) > now);
  } catch (err: any) {
    console.error("Error fetching pending invitations:", err);
    return [];
  }
}

/**
 * Resend invitation by email (generates new token)
 */
export async function resendInvitation(email: string): Promise<PendingInvitation | null> {
  try {
    const { data: existing, error: fetchError } = await supabaseClient
      .from("pending_invitations")
      .select("*")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

    if (!existing) {
      throw new Error("No pending invitation found for this email");
    }

    // Generate new token
    const newToken = generateToken();

    const { data, error } = await supabaseClient
      .from("pending_invitations")
      .update({
        token: newToken,
        invited_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return data || null;
  } catch (err: any) {
    console.error("Error resending invitation:", err);
    throw err;
  }
}

/**
 * Generate shareable invitation link
 */
export function generateInvitationLink(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${token}`;
}
