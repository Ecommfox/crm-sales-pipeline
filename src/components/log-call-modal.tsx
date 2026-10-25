import { useState, useEffect } from "react";
import { PhoneCall } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { dataProvider } from "@/providers/data";
import type { Lead, CallResult, CallType, Stage } from "@/types";

// ── Options ──────────────────────────────────────────────────────────────────

const CALL_RESULTS: CallResult[] = [
  "Ignoré",
  "Répondeur",
  "Barrage secrétaire",
  "Non décroché",
  "Non appelé",
  "Numéro non attribué",
  "Liste noire",
  "Positif",
  "Negatif",
];

const CALL_TYPES: CallType[] = ["Normal", "Qualification", "Rappel", "Rendez-vous", "Relance", "Closing"];

const STAGE_OPTIONS: { value: Stage; label: string; className: string }[] = [
  {
    value: "none",
    label: "Nouveau",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  {
    value: "pre-qualified",
    label: "Pré-qualifié",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "qualified",
    label: "Qualifié",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    value: "pre-scheduled",
    label: "RDV planifié",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    value: "confirmed",
    label: "RDV confirmé",
    className: "bg-green-100 text-green-700 border-green-200",
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface LogCallModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LogCallModal({ lead, open, onOpenChange, onSuccess }: LogCallModalProps) {
  const [callResult, setCallResult] = useState<CallResult | "">("");
  const [callType, setCallType] = useState<CallType | "">("");
  const [newStage, setNewStage] = useState<Stage | "">("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form whenever a new lead is selected
  useEffect(() => {
    if (lead) {
      setCallResult("");
      setCallType("");
      setNewStage(lead.stage);
      setComment("");
      setErrors({});
    }
  }, [lead]);

  const isValid = callResult !== "" && callType !== "" && newStage !== "";

  function validate() {
    const e: Record<string, string> = {};
    if (!callResult) e.callResult = "Ce champ est obligatoire";
    if (!callType) e.callType = "Ce champ est obligatoire";
    if (!newStage) e.newStage = "Ce champ est obligatoire";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!lead || !validate()) return;
    setIsLoading(true);
    try {
      const now = new Date().toISOString();

      // 1. Update the lead record
      await dataProvider.update({
        resource: "leads",
        id: lead.id,
        variables: {
          stage: newStage as Stage,
          etatAppel: callResult as CallResult,
          dateHeureAppel: now,
          ...(comment.trim() ? { commentaireTeleoperateur: comment.trim() } : {}),
        },
      });

      // 2. Create the call log entry
      await dataProvider.create({
        resource: "callLogs",
        variables: {
          leadId: lead.id,
          date: now,
          callResult: callResult as CallResult,
          callType: callType as CallType,
          leadStatusAfter: newStage as Stage,
          comment: comment.trim(),
          teleoperator: lead.teleoperateurAppel ?? "Opérateur",
        },
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("[LogCallModal] Error saving call:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedStageConfig = STAGE_OPTIONS.find((s) => s.value === newStage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PhoneCall className="h-4 w-4 shrink-0" />
            Journal d'appel
          </DialogTitle>
          {lead && (
            <DialogDescription className="text-sm">
              <span className="font-medium text-foreground">
                {lead.civilite} {lead.prenom} {lead.nom}
              </span>{" "}
              — {lead.societe}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Résultat de l'appel */}
          <div className="space-y-1.5">
            <Label htmlFor="callResult">
              Résultat de l'appel <span className="text-destructive">*</span>
            </Label>
            <Select
              value={callResult}
              onValueChange={(v) => {
                setCallResult(v as CallResult);
                setErrors((e) => ({ ...e, callResult: "" }));
              }}>
              <SelectTrigger id="callResult" className={errors.callResult ? "border-destructive" : ""}>
                <SelectValue placeholder="Sélectionner un résultat…" />
              </SelectTrigger>
              <SelectContent>
                {CALL_RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.callResult && <p className="text-xs text-destructive">{errors.callResult}</p>}
          </div>

          {/* Type d'appel */}
          <div className="space-y-1.5">
            <Label htmlFor="callType">
              Type d'appel <span className="text-destructive">*</span>
            </Label>
            <Select
              value={callType}
              onValueChange={(v) => {
                setCallType(v as CallType);
                setErrors((e) => ({ ...e, callType: "" }));
              }}>
              <SelectTrigger id="callType" className={errors.callType ? "border-destructive" : ""}>
                <SelectValue placeholder="Sélectionner un type…" />
              </SelectTrigger>
              <SelectContent>
                {CALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.callType && <p className="text-xs text-destructive">{errors.callType}</p>}
          </div>

          {/* Nouveau statut du lead */}
          <div className="space-y-1.5">
            <Label htmlFor="newStage">
              Nouveau statut du lead <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newStage}
              onValueChange={(v) => {
                setNewStage(v as Stage);
                setErrors((e) => ({ ...e, newStage: "" }));
              }}>
              <SelectTrigger id="newStage" className={errors.newStage ? "border-destructive" : ""}>
                <SelectValue placeholder="Sélectionner un statut…" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.newStage && <p className="text-xs text-destructive">{errors.newStage}</p>}
            {selectedStageConfig && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Nouveau statut :</span>
                <Badge variant="outline" className={`text-xs ${selectedStageConfig.className}`}>
                  {selectedStageConfig.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Commentaire */}
          <div className="space-y-1.5">
            <Label htmlFor="comment">Commentaire téléopérateur</Label>
            <Textarea
              id="comment"
              placeholder="Notes sur l'appel (optionnel)…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading} className="gap-2">
            <PhoneCall className="h-3.5 w-3.5" />
            {isLoading ? "Enregistrement…" : "Enregistrer l'appel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
