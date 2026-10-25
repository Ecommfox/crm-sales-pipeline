import { useState } from "react";
import {
  getScoringSettings,
  saveScoringSettings,
  resetScoringSettings,
  DEFAULT_SCORING_SETTINGS,
  type ScoringSettings,
} from "@/lib/scoring-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, RotateCcw, Save, Wifi } from "lucide-react";
import { RealtimeStatusIndicator } from "@/components/realtime-status-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CRITERIA = [
  {
    key: "interestLevelPoints" as keyof ScoringSettings,
    label: "Niveau d'intérêt renseigné",
    description: "Points attribués si le niveau d'intérêt est sélectionné",
  },
  {
    key: "mainContactPoints" as keyof ScoringSettings,
    label: "Contact principal confirmé",
    description: "Points attribués si un contact principal est sélectionné",
  },
  {
    key: "identifiedNeedsPoints" as keyof ScoringSettings,
    label: "Besoins identifiés renseignés",
    description: "Points attribués si le champ besoins identifiés est rempli",
  },
  {
    key: "painPointsPerTag" as keyof ScoringSettings,
    label: "Points de douleur (par tag)",
    description: "Points par tag de point de douleur ajouté",
  },
  {
    key: "painPointsMax" as keyof ScoringSettings,
    label: "Maximum points de douleur",
    description: "Nombre maximum de points attribuables pour les points de douleur",
  },
  {
    key: "openForAppointmentPoints" as keyof ScoringSettings,
    label: "Ouvert à un rendez-vous",
    description: "Points attribués si le prospect est ouvert à un rendez-vous",
  },
  {
    key: "callPerLog" as keyof ScoringSettings,
    label: "Appel journalisé (par appel)",
    description: "Points par appel enregistré",
  },
  {
    key: "callMax" as keyof ScoringSettings,
    label: "Maximum points d'appels",
    description: "Nombre maximum de points attribuables pour les appels",
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ScoringSettings>(getScoringSettings);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof ScoringSettings, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setSettings((prev) => ({ ...prev, [key]: num }));
    setSaved(false);
  };

  const handleSave = () => {
    saveScoringSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetScoringSettings();
    setSettings({ ...DEFAULT_SCORING_SETTINGS });
    setSaved(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configurez les règles de scoring et le comportement de l'application.
        </p>
      </div>

      <Separator />

      {/* Real-time Status */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wifi className="h-4 w-4" />
            État de la connexion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connexion Supabase</span>
            <RealtimeStatusIndicator />
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              Les mises à jour en temps réel sont activées. Les données se sincronisent automatiquement quand vous
              importez des leads ou que d'autres utilisateurs effectuent des modifications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scoring des leads</CardTitle>
          <CardDescription>
            Définissez les points attribués pour chaque critère de qualification. Ces valeurs sont utilisées pour
            calculer le score de chaque lead qualifié.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CRITERIA.map(({ key, label, description }) => (
            <div key={key} className="grid grid-cols-[1fr_100px] gap-4 items-start">
              <div>
                <Label className="font-medium text-sm">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  value={settings[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="text-center font-semibold"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">pts</span>
              </div>
            </div>
          ))}

          <Separator className="my-2" />

          {/* Score legend */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Barème des couleurs</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-0.5 bg-gray-100 text-gray-600 border-gray-300 font-medium">
                0–20 pts — Gris
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-0.5 bg-yellow-100 text-yellow-700 border-yellow-300 font-medium">
                21–50 pts — Jaune
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-0.5 bg-orange-100 text-orange-700 border-orange-300 font-medium">
                51–80 pts — Orange
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-0.5 bg-green-100 text-green-700 border-green-300 font-medium">
                81+ pts — Vert
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="gap-2">
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Enregistré
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);
}
