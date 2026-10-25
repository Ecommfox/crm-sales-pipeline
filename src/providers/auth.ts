import type { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "@/lib/supabaseClient";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true };
  },

  register: async ({ email, password }) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile entry
    if (data.user) {
      const { error: profileError } = await supabaseClient
        .from("user_profiles")
        .insert({
          id: data.user.id,
          email: email,
          full_name: email.split("@")[0],
          role: "teleoperator",
          is_active: true,
        });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        // Don't throw - user is already created, profile will be created manually
      }
    }

    return { success: true };
  },

  check: async () => {
    const { data } = await supabaseClient.auth.getSession();
    return { authenticated: !!data.session };
  },

  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.email?.split("@")[0] || "User",
    };
  },

  getPermissions: async () => {
    // Placeholder for future role-based permissions
    return null;
  },

  logout: async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      return { success: true, redirect: "/login" };
    } catch (err: any) {
      console.error("Logout error:", err);
      return { success: false, redirect: "/login" };
    }
  },

  onError: async (error) => {
    console.error("Auth error:", error);
  },
};
