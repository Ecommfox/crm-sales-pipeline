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

  register: async ({ email, password, firstName, surname }) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: [firstName, surname]
            .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
            .map((name) => name.trim())
            .join(" ") || email.split("@")[0],
        },
      },
    });

    if (error) throw error;

    return { success: true };
  },

  check: async () => {
    const { data } = await supabaseClient.auth.getSession();
    return { authenticated: !!data.session };
  },

  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) return null;

    const { data: profile, error } = await supabaseClient
      .from("user_profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    if (error) throw error;

    return {
      id: data.user.id,
      email: data.user.email,
      name: profile?.full_name || data.user.email?.split("@")[0] || "User",
    };
  },

  getPermissions: async () => {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return null;

    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    return profile?.role ?? null;
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
    return { error };
  },
};
