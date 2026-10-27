import { useEffect, useState } from "react";
import { AlertCircle, Loader2, UserRound } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { UserRole } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileDetails {
  email: string;
  full_name: string;
  role: UserRole;
}

function splitName(fullName: string) {
  const [firstName = "", ...surname] = fullName.trim().split(/\s+/);
  return { firstName: firstName || "—", surname: surname.join(" ") || "—" };
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  teleoperator: "Teleoperator",
  viewer: "Viewer",
};

export function UserProfileCard() {
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [callsToday, setCallsToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setError("");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("You must be signed in to view your profile.");

        const user = userData.user;
        const { data: profileData, error: profileError } = await supabaseClient
          .from("user_profiles")
          .select("email, full_name, role")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const { count, error: callsError } = await supabaseClient
          .from("call_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startOfDay.toISOString())
          .lt("created_at", endOfDay.toISOString());

        if (callsError) throw callsError;
        if (!active) return;

        setProfile({
          email: profileData.email ?? user.email ?? "",
          full_name: profileData.full_name ?? "",
          role: profileData.role as UserRole,
        });
        setCallsToday(count ?? 0);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Profile information is unavailable."}</AlertDescription>
      </Alert>
    );
  }

  const { firstName, surname } = splitName(profile.full_name);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium">{firstName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Surname</p>
          <p className="font-medium">{surname}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{profile.email}</p>
          <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="font-medium">{roleLabels[profile.role]}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Calls completed today</p>
          <p className="font-medium">{callsToday}</p>
        </div>
      </CardContent>
    </Card>
  );
}
