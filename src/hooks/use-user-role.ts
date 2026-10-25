// src/hooks/use-user-role.ts
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { UserRole } from "@/types";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
          console.error("Auth error:", userError);
          setError("Failed to get user");
          setRole(null);
          setLoading(false);
          return;
        }

        if (!userData.user) {
          console.warn("No authenticated user found");
          setRole(null);
          setLoading(false);
          return;
        }

        console.log("Fetching role for user:", userData.user.id, userData.user.email);

        const { data: profile, error: profileError } = await supabaseClient
          .from("user_profiles")
          .select("role, id, email")
          .eq("id", userData.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          console.warn("User profile not found. User may need to be promoted to admin.");
          setError("User profile not found");
          setRole(null);
        } else if (profile) {
          console.log("User profile found:", profile);
          setRole(profile.role);
          setError(null);
        }
      } catch (error) {
        console.error("Unexpected error fetching user role:", error);
        setError(`Error: ${String(error)}`);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return {
    role,
    loading,
    error,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isTeleoperator: role === "teleoperator",
    isViewer: role === "viewer",
  };
}