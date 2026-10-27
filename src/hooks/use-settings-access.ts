import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUserRole } from "@/hooks/use-user-role";

export function useSettingsAccess() {
  const { role, isAdmin, loading: roleLoading } = useUserRole();
  const [canViewSettings, setCanViewSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPermission = async () => {
      if (roleLoading) return;
      if (!role) {
        setCanViewSettings(false);
        setError("Your user role could not be verified.");
        setLoading(false);
        return;
      }
      if (isAdmin) {
        setCanViewSettings(true);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: permissionError } = await supabaseClient
        .from("role_settings_permissions")
        .select("can_view_settings")
        .eq("role", role)
        .maybeSingle();

      if (!active) return;
      if (permissionError) {
        setCanViewSettings(false);
        setError(permissionError.message);
      } else {
        setCanViewSettings(data?.can_view_settings ?? false);
        setError(null);
      }
      setLoading(false);
    };

    void loadPermission();
    return () => {
      active = false;
    };
  }, [role, isAdmin, roleLoading]);

  return { canViewSettings, loading: roleLoading || loading, error };
}
