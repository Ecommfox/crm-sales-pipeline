// src/pages/admin/settings.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUserRole } from "@/hooks/use-user-role";
import { logActivity } from "@/lib/auditLogger";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Settings as SettingsIcon } from "lucide-react";
import type { ScoringSettings } from "@/types";

interface SettingsFormData {
  [key: string]: number;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [settings, setSettings] = useState<ScoringSettings[]>([]);
  const [formData, setFormData] = useState<SettingsFormData>({});
  const [originalData, setOriginalData] = useState<SettingsFormData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch settings
  useEffect(() => {
    if (!isAdmin) return;

    const fetchSettings = async () => {
      try {
        setError("");
        const { data, error: fetchError } = await supabaseClient
          .from("scoring_settings")
          .select("*")
          .order("setting_key", { ascending: true });

        if (fetchError) throw fetchError;

        setSettings(data || []);

        // Initialize form data
        const initialData: SettingsFormData = {};
        (data || []).forEach((setting) => {
          initialData[setting.setting_key] = setting.setting_value;
        });
        setFormData(initialData);
        setOriginalData(initialData);
      } catch (err: any) {
        setError(err.message || "Failed to load settings");
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAdmin]);

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        [key]: numValue,
      }));
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      // Track which settings changed
      const changedSettings: Record<string, { oldValue: number; newValue: number }> = {};
      for (const key in formData) {
        if (formData[key] !== originalData[key]) {
          changedSettings[key] = {
            oldValue: originalData[key],
            newValue: formData[key],
          };
        }
      }

      // Update each setting
      for (const setting of settings) {
        const newValue = formData[setting.setting_key];
        if (newValue !== setting.setting_value) {
          const { error: updateError } = await supabaseClient
            .from("scoring_settings")
            .update({
              setting_value: newValue,
              updated_at: new Date().toISOString(),
            })
            .eq("id", setting.id);

          if (updateError) throw updateError;
        }
      }

      // Log the changes
      const changeDetails = Object.entries(changedSettings)
        .map(([key, values]) => `${key}: ${values.oldValue} → ${values.newValue}`)
        .join("; ");

      await logActivity({
        action: "update",
        resource_type: "settings",
        resource_id: "",
        details: `Updated scoring settings: ${changeDetails}`,
      });

      setOriginalData(formData);
      setSuccessMessage("Settings saved successfully!");
      setShowConfirmDialog(false);

      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    setError("");
    setSuccessMessage("");
  };

  // Helper function to get a user-friendly label from setting key
  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      qualification_question_answered: "Qualification Question Answered",
      contact_person_confirmed: "Contact Person Confirmed",
      needs_identified: "Needs Identified",
      pain_points_entered: "Pain Points Entered",
      open_for_appointment: "Open for Appointment",
      interest_level_faible: "Interest Level: Low",
      interest_level_moyen: "Interest Level: Medium",
      interest_level_eleve: "Interest Level: High",
    };
    return labels[key] || key.replace(/_/g, " ");
  };

  // Helper function to get description
  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      qualification_question_answered: "Points awarded for each qualification question answered",
      contact_person_confirmed: "Points for confirming the main contact person",
      needs_identified: "Points for identifying customer needs",
      pain_points_entered: "Points per pain point documented",
      open_for_appointment: "Points if customer is open for scheduling an appointment",
      interest_level_faible: "Base points for low interest level leads",
      interest_level_moyen: "Points for medium interest level leads",
      interest_level_eleve: "Points for high interest level leads",
    };
    return descriptions[key] || "";
  };

  const getScoringGroupLabel = (key: string): string => {
    if (key.includes("interest_level")) return "Interest Level Scoring";
    return "Action-Based Scoring";
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6 max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group settings by type
  const actionBasedSettings = settings.filter(
    (s) => !s.setting_key.includes("interest_level")
  );
  const interestLevelSettings = settings.filter((s) =>
    s.setting_key.includes("interest_level")
  );

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            System Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure lead scoring thresholds and system parameters
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Lead Scoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Scoring Configuration</CardTitle>
          <CardDescription>
            Adjust the points awarded for different lead qualification activities and interest
            levels
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Action-Based Scoring */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">
                Action-Based
              </Badge>
              <h3 className="font-semibold text-foreground">Qualification Actions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {actionBasedSettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.setting_key} className="font-medium">
                    {getSettingLabel(setting.setting_key)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription(setting.setting_key)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id={setting.setting_key}
                      type="number"
                      min="0"
                      max="200"
                      value={formData[setting.setting_key] || 0}
                      onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                      className="font-mono"
                    />
                    <span className="text-sm font-semibold text-muted-foreground w-12">
                      pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* Interest Level Scoring */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50">
                Interest-Based
              </Badge>
              <h3 className="font-semibold text-foreground">Interest Level Scoring</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {interestLevelSettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.setting_key} className="font-medium">
                    {getSettingLabel(setting.setting_key)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getSettingDescription(setting.setting_key)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id={setting.setting_key}
                      type="number"
                      min="0"
                      max="200"
                      value={formData[setting.setting_key] || 0}
                      onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                      className="font-mono"
                    />
                    <span className="text-sm font-semibold text-muted-foreground w-12">
                      pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || saving}
        >
          Reset
        </Button>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>💡 Info:</strong> Lead scores are calculated automatically based on these
            settings. Changes will apply to all future lead scoring calculations.
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Settings Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This will affect future lead scoring
              calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
