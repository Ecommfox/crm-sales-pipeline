import { useState, useEffect } from "react";
import { useShow, useList } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  PhoneCall,
  Pencil,
  CalendarClock,
  Check,
  X,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Hash,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { LogCallModal } from "@/components/log-call-modal";
import { ScoreBadge } from "@/components/score-badge";
import { dataProvider } from "@/providers/data";
import type { Lead, CallLog, Stage, CallResult } from "@/types";
import { getQualificationMap, getQualData, calculateScore } from "@/lib/scoring";

// ── Stage configuration ───────────────────────────────────────────────────────

const STAGES: { value: Stage; label: string }[] = [
  { value: "none", label: "Nouveau" },
  { value: "pre-qualified", label: "Pré-qualifié" },
  { value: "qualified", label: "Qualifié" },
  { value: "pre-scheduled", label: "RDV planifié" },
  { value: "confirmed", label: "RDV confirmé" },
];

const STAGE_CONFIG: Record<Stage, { label: string; badgeClass: string; dotClass: string; activeClass: string }> = {
  none: {
    label: "Nouveau",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    dotClass: "bg-gray-400",
    activeClass: "bg-gray-600 text-white border-gray-600",
  },
  "pre-qualified": {
    label: "Pré-qualifié",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
    dotClass: "bg-blue-500",
    activeClass: "bg-blue-600 text-white border-blue-600",
  },
  qualified: {
    label: "Qualifié",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    dotClass: "bg-amber-500",
    activeClass: "bg-amber-500 text-white border-amber-500",
  },
  "pre-scheduled": {
    label: "RDV planifié",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
    dotClass: "bg-orange-500",
    activeClass: "bg-orange-500 text-white border-orange-500",
  },
  confirmed: {
    label: "RDV confirmé",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
    dotClass: "bg-green-500",
    activeClass: "bg-green-600 text-white border-green-600",
  },
};

const CALL_RESULT_COLORS: Record<CallResult, string> = {
  Ignoré: "bg-gray-100 text-gray-600 border-gray-200",
  Répondeur: "bg-sky-100 text-sky-700 border-sky-200",
  "Barrage secrétaire": "bg-purple-100 text-purple-700 border-purple-200",
  "Non décroché": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Non appelé": "bg-slate-100 text-slate-600 border-slate-200",
  "Numéro non attribué": "bg-red-100 text-red-600 border-red-200",
  "Liste noire": "bg-red-900/20 text-red-800 border-red-300",
};

const CALL_TYPE_COLORS: Record<string, string> = {
  Normal: "text-gray-500",
  Qualification: "text-blue-600",
  Rappel: "text-orange-500",
  "Rendez-vous": "text-green-600",
  Relance: "text-purple-600",
  Closing: "text-red-600",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CIVILITE_OPTIONS = ["M.", "Mme", "Dr.", "Me", "Pr."];

// ── Section component ─────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 rounded-t-lg">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Field display / edit ──────────────────────────────────────────────────────

function Field({
  label,
  value,
  editMode,
  editNode,
  href,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  editMode?: boolean;
  editNode?: React.ReactNode;
  href?: string;
  mono?: boolean;
}) {
  const display = value || "—";
  return (
    <div className="space-y-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {editMode && editNode ? (
        editNode
      ) : href && value ? (
        <a href={href} className={`text-sm text-blue-600 hover:underline block ${mono ? "font-mono" : ""}`}>
          {display}
        </a>
      ) : (
        <p className={`text-sm text-foreground ${mono ? "font-mono" : ""} ${!value ? "text-muted-foreground" : ""}`}>
          {display}
        </p>
      )}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>;
}

// ── Stage tracker ─────────────────────────────────────────────────────────────

function StageTracker({ current }: { current: Stage }) {
  const currentIndex = STAGES.findIndex((s) => s.value === current);
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 rounded-t-lg">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Pipeline</h3>
      </div>
      <div className="p-4">
        <div className="relative flex flex-col gap-0">
          {STAGES.map((stage, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;
            const cfg = STAGE_CONFIG[stage.value];

            return (
              <div key={stage.value} className="flex items-start gap-3 relative">
                {/* connector line */}
                {idx < STAGES.length - 1 && (
                  <div className={`absolute left-[11px] top-6 w-0.5 h-6 ${isPast ? "bg-primary" : "bg-border"}`} />
                )}
                {/* dot */}
                <div
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                    isCurrent
                      ? `${cfg.dotClass} border-transparent shadow-sm ring-2 ring-offset-1 ring-current`
                      : isPast
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                  }`}>
                  {isPast && <Check className="h-3 w-3 text-primary-foreground" />}
                  {isCurrent && <div className="w-2 h-2 rounded-full bg-white/90" />}
                </div>
                {/* label */}
                <div className="pb-6">
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? "text-foreground" : isFuture ? "text-muted-foreground" : "text-foreground/70"
                    }`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <Badge variant="outline" className={`ml-2 text-xs py-0 h-5 ${cfg.badgeClass}`}>
                      Actuel
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Call log timeline ─────────────────────────────────────────────────────────

function CallTimeline({ logs }: { logs: CallLog[] }) {
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 rounded-t-lg">
        <PhoneCall className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Historique des appels</h3>
        {logs.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
            {logs.length}
          </Badge>
        )}
      </div>
      <div className="p-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun appel enregistré</p>
        ) : (
          <div className="space-y-4">
            {sorted.map((log, idx) => {
              const resultColor = CALL_RESULT_COLORS[log.callResult] ?? "bg-gray-100 text-gray-600";
              const typeColor = CALL_TYPE_COLORS[log.callType] ?? "text-gray-500";
              const stageAfter = STAGE_CONFIG[log.leadStatusAfter];

              return (
                <div key={log.id} className="relative flex gap-3">
                  {/* timeline line */}
                  {idx < sorted.length - 1 && <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border" />}
                  {/* icon dot */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted border flex items-center justify-center mt-0.5 z-10">
                    <PhoneCall className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {/* content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <Badge variant="outline" className={`text-xs py-0 h-5 ${resultColor}`}>
                        {log.callResult}
                      </Badge>
                      <span className={`text-xs font-medium ${typeColor}`}>{log.callType}</span>
                      {stageAfter && (
                        <span className="text-xs text-muted-foreground">
                          →{" "}
                          <span
                            className={`font-medium ${stageAfter.badgeClass.includes("blue") ? "text-blue-600" : stageAfter.badgeClass.includes("amber") ? "text-amber-600" : stageAfter.badgeClass.includes("green") ? "text-green-600" : stageAfter.badgeClass.includes("orange") ? "text-orange-600" : "text-gray-600"}`}>
                            {stageAfter.label}
                          </span>
                        </span>
                      )}
                    </div>
                    {log.comment && (
                      <p className="text-xs text-foreground/80 bg-muted/50 rounded px-2 py-1.5 mb-1">{log.comment}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDateShort(log.date)}</span>
                      {log.teleoperator && (
                        <>
                          <span>·</span>
                          <span>{log.teleoperator}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadShowPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { query } = useShow<Lead>({ resource: "leads", id });
  const lead = query.data?.data;
  const isLoading = query.isLoading;

  // Call logs for this lead
  const { query: callLogsQuery } = useList<CallLog>({
    resource: "callLogs",
    pagination: { pageSize: 100 },
  });
  const callLogs = (callLogsQuery.data?.data ?? []).filter((log: CallLog) => String(log.leadId) === String(id));

  // Score calculation
  const qualMap = getQualificationMap();
  const qualData = lead ? getQualData(lead.id, qualMap) : null;
  const score = qualData ? calculateScore(qualData, callLogs.length) : 0;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Log call modal
  const [logCallOpen, setLogCallOpen] = useState(false);

  // Sync editForm when lead loads
  useEffect(() => {
    if (lead) {
      setEditForm({ ...lead });
    }
  }, [lead]);

  function handleEditStart() {
    if (lead) setEditForm({ ...lead });
    setIsEditing(true);
  }

  function handleEditCancel() {
    setIsEditing(false);
    if (lead) setEditForm({ ...lead });
  }

  async function handleSave() {
    if (!lead) return;
    setIsSaving(true);
    try {
      await dataProvider.update({
        resource: "leads",
        id: lead.id,
        variables: editForm,
      });
      await query.refetch();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCallLogged() {
    query.refetch();
    callLogsQuery.refetch();
  }

  function ef(field: keyof Lead) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Lead introuvable.</p>
        <Button variant="outline" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Leads
        </Button>
      </div>
    );
  }

  const stageCfg = STAGE_CONFIG[lead.stage];

  return (
    <div className="flex flex-col h-full overflow-auto bg-muted/20">
      {/* ── Top header bar ── */}
      <div className="sticky top-0 z-20 border-b bg-background shadow-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          {/* Back */}
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Lead name + company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold truncate">
                {lead.civilite} {lead.prenom} {lead.nom}
              </h1>
              <span className="text-muted-foreground text-sm hidden sm:inline">—</span>
              <span className="text-sm text-muted-foreground font-medium truncate hidden sm:block">{lead.societe}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">{lead.numeroUnique}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground">{lead.activite}</span>
            </div>
          </div>

          {/* Stage badge */}
          <Badge variant="outline" className={`shrink-0 text-sm font-semibold px-3 py-1 ${stageCfg.badgeClass}`}>
            {stageCfg.label}
          </Badge>

          {/* Score badge */}
          <ScoreBadge score={score} size="md" />

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleEditCancel} disabled={isSaving} className="gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {isSaving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLogCallOpen(true)}>
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Journal d'appel</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEditStart}>
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Modifier</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" disabled>
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Planifier RDV</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 items-start">
        {/* ── Left column (wider — 2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Informations société */}
          <Section icon={Building2} title="Informations société">
            <FieldGrid>
              <Field
                label="Société"
                value={isEditing ? editForm.societe : lead.societe}
                editMode={isEditing}
                editNode={<Input value={editForm.societe ?? ""} onChange={ef("societe")} className="h-8 text-sm" />}
              />
              <Field
                label="SIRET"
                value={isEditing ? editForm.siret : lead.siret}
                mono
                editMode={isEditing}
                editNode={
                  <Input value={editForm.siret ?? ""} onChange={ef("siret")} className="h-8 text-sm font-mono" />
                }
              />
              <div className="col-span-2">
                <Field
                  label="Activité"
                  value={isEditing ? editForm.activite : lead.activite}
                  editMode={isEditing}
                  editNode={<Input value={editForm.activite ?? ""} onChange={ef("activite")} className="h-8 text-sm" />}
                />
              </div>
            </FieldGrid>
          </Section>

          {/* Contact principal */}
          <Section icon={User} title="Contact principal">
            <FieldGrid>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Civilité</Label>
                {isEditing ? (
                  <Select
                    value={editForm.civilite ?? ""}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, civilite: v }))}>
                    <SelectTrigger className="h-8 text-sm mt-0.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CIVILITE_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{lead.civilite}</p>
                )}
              </div>
              <Field
                label="Nom"
                value={isEditing ? editForm.nom : lead.nom}
                editMode={isEditing}
                editNode={<Input value={editForm.nom ?? ""} onChange={ef("nom")} className="h-8 text-sm" />}
              />
              <Field
                label="Prénom"
                value={isEditing ? editForm.prenom : lead.prenom}
                editMode={isEditing}
                editNode={<Input value={editForm.prenom ?? ""} onChange={ef("prenom")} className="h-8 text-sm" />}
              />
              <Field
                label="Fonction"
                value={isEditing ? editForm.fonction : lead.fonction}
                editMode={isEditing}
                editNode={<Input value={editForm.fonction ?? ""} onChange={ef("fonction")} className="h-8 text-sm" />}
              />
              <Field
                label="Téléphone fixe"
                value={isEditing ? editForm.telephoneFixe : lead.telephoneFixe}
                href={!isEditing ? `tel:${lead.telephoneFixe}` : undefined}
                editMode={isEditing}
                editNode={
                  <Input value={editForm.telephoneFixe ?? ""} onChange={ef("telephoneFixe")} className="h-8 text-sm" />
                }
              />
              <Field
                label="Téléphone portable"
                value={isEditing ? editForm.telephonePortable : lead.telephonePortable}
                href={!isEditing ? `tel:${lead.telephonePortable}` : undefined}
                editMode={isEditing}
                editNode={
                  <Input
                    value={editForm.telephonePortable ?? ""}
                    onChange={ef("telephonePortable")}
                    className="h-8 text-sm"
                  />
                }
              />
              <div className="col-span-2">
                <Field
                  label="Mail"
                  value={isEditing ? editForm.mail : lead.mail}
                  href={!isEditing ? `mailto:${lead.mail}` : undefined}
                  editMode={isEditing}
                  editNode={
                    <Input value={editForm.mail ?? ""} onChange={ef("mail")} className="h-8 text-sm" type="email" />
                  }
                />
              </div>
            </FieldGrid>
          </Section>

          {/* Localisation */}
          <Section icon={MapPin} title="Localisation">
            <FieldGrid>
              <div className="col-span-2">
                <Field
                  label="Adresse"
                  value={isEditing ? editForm.adresse : lead.adresse}
                  editMode={isEditing}
                  editNode={<Input value={editForm.adresse ?? ""} onChange={ef("adresse")} className="h-8 text-sm" />}
                />
              </div>
              <Field
                label="Code Postal"
                value={isEditing ? editForm.codePostal : lead.codePostal}
                editMode={isEditing}
                editNode={
                  <Input value={editForm.codePostal ?? ""} onChange={ef("codePostal")} className="h-8 text-sm" />
                }
              />
              <Field
                label="Ville"
                value={isEditing ? editForm.ville : lead.ville}
                editMode={isEditing}
                editNode={<Input value={editForm.ville ?? ""} onChange={ef("ville")} className="h-8 text-sm" />}
              />
            </FieldGrid>
          </Section>

          {/* Prospection */}
          <Section icon={Phone} title="Prospection">
            <FieldGrid>
              <Field
                label="Numéro unique"
                value={isEditing ? editForm.numeroUnique : lead.numeroUnique}
                mono
                editMode={isEditing}
                editNode={
                  <Input
                    value={editForm.numeroUnique ?? ""}
                    onChange={ef("numeroUnique")}
                    className="h-8 text-sm font-mono"
                  />
                }
              />
              <Field
                label="Téléopérateur"
                value={isEditing ? (editForm.teleoperateurAppel ?? "") : lead.teleoperateurAppel}
                editMode={isEditing}
                editNode={
                  <Input
                    value={editForm.teleoperateurAppel ?? ""}
                    onChange={ef("teleoperateurAppel")}
                    className="h-8 text-sm"
                  />
                }
              />
              <Field label="Date / Heure d'appel" value={formatDate(lead.dateHeureAppel)} />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">État appel</span>
                {lead.etatAppel ? (
                  <div className="mt-1">
                    <Badge variant="outline" className={`text-xs ${CALL_RESULT_COLORS[lead.etatAppel] ?? ""}`}>
                      {lead.etatAppel}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                  Commentaire téléopérateur
                </span>
                {isEditing ? (
                  <Textarea
                    value={editForm.commentaireTeleoperateur ?? ""}
                    onChange={ef("commentaireTeleoperateur")}
                    rows={2}
                    className="text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-foreground/80 bg-muted/40 rounded px-3 py-2 min-h-[2.5rem]">
                    {lead.commentaireTeleoperateur || (
                      <span className="text-muted-foreground italic">Aucun commentaire</span>
                    )}
                  </p>
                )}
              </div>
            </FieldGrid>
          </Section>
        </div>

        {/* ── Right column (narrower — 1/3) ── */}
        <div className="space-y-4">
          <StageTracker current={lead.stage} />
          <CallTimeline logs={callLogs} />
        </div>
      </div>

      {/* Log Call Modal */}
      <LogCallModal lead={lead} open={logCallOpen} onOpenChange={setLogCallOpen} onSuccess={handleCallLogged} />
    </div>
  );
}
