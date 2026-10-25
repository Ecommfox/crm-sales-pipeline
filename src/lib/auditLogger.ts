// src/lib/auditLogger.ts
import { supabaseClient } from "./supabaseClient";

export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "view";
export type ResourceType = "user" | "lead" | "company" | "contact" | "appointment" | "call" | "settings";

interface LogActivityParams {
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: string;
  details?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
}

/**
 * Log an administrative action to the audit_logs table
 * This creates a record of who did what and when
 */
export async function logActivity({
  action,
  resource_type,
  resource_id,
  details,
  old_value,
  new_value,
}: LogActivityParams) {
  try {
    // Get current user
    const { data: userData } = await supabaseClient.auth.getUser();
    if (!userData.user) {
      console.warn("No authenticated user for audit log");
      return;
    }

    // Get user email for audit log
    const userEmail = userData.user.email;
    const userId = userData.user.id;

    // Create audit log entry
    const { error } = await supabaseClient.from("audit_logs").insert({
      user_id: userId,
      user_email: userEmail,
      action,
      resource_type,
      resource_id,
      details,
      old_value,
      new_value,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create audit log:", error);
    } else {
      console.log(`✓ Audit logged: ${action} ${resource_type}${resource_id ? ` #${resource_id}` : ""}`);
    }
  } catch (err) {
    console.error("Error logging activity:", err);
  }
}

/**
 * Log a user role change with before/after details
 */
export async function logUserRoleChange(
  userId: string,
  userEmail: string,
  oldRole: string,
  newRole: string
) {
  await logActivity({
    action: "update",
    resource_type: "user",
    resource_id: userId,
    details: `Changed role from ${oldRole} to ${newRole}`,
    old_value: { role: oldRole },
    new_value: { role: newRole },
  });
}

/**
 * Log a user status change (active/inactive)
 */
export async function logUserStatusChange(
  userId: string,
  userEmail: string,
  oldStatus: boolean,
  newStatus: boolean
) {
  await logActivity({
    action: "update",
    resource_type: "user",
    resource_id: userId,
    details: `Changed status to ${newStatus ? "active" : "inactive"}`,
    old_value: { is_active: oldStatus },
    new_value: { is_active: newStatus },
  });
}

/**
 * Log user profile updates
 */
export async function logUserProfileUpdate(
  userId: string,
  userEmail: string,
  changes: Record<string, { old: any; new: any }>
) {
  const changesList = Object.entries(changes)
    .map(([field, { old, new: newVal }]) => `${field}: "${old}" → "${newVal}"`)
    .join(", ");

  await logActivity({
    action: "update",
    resource_type: "user",
    resource_id: userId,
    details: `Updated: ${changesList}`,
    old_value: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
    new_value: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
  });
}

/**
 * Log user creation
 */
export async function logUserCreated(userId: string, userEmail: string) {
  await logActivity({
    action: "create",
    resource_type: "user",
    resource_id: userId,
    details: `New user registration: ${userEmail}`,
  });
}
