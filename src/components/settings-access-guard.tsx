import { Loader2, AlertCircle } from "lucide-react";
import { Navigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettingsAccess } from "@/hooks/use-settings-access";

export function SettingsAccessGuard({ children }: { children: React.ReactNode }) {
  const { canViewSettings, loading, error } = useSettingsAccess();

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Settings access could not be verified: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!canViewSettings) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
