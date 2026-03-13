import { useState, useEffect } from "react";
import { CalendarIcon, Link2, Building2, Upload, Link } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { dataProvider } from "@/providers/data";
import { useNotification } from "@refinedev/core";
import type { Lead, Contact, AppointmentType } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScheduleAppointmentModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contacts: Contact[];
  /** Pre-selected main contact id (from qualification data) */
  mainContactId?: string;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; icon: string }[] = [
  { value: "Téléphonique", label: "Téléphonique", icon: "📞" },
  { value: "Visio", label: "Visio", icon: "🎥" },
  { value: "Présentiel", label: "Présentiel", icon: "🤝" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function ScheduleAppointmentModal({
  lead,
  open,
  onOpenChange,
  onSuccess,
  contacts,
  mainContactId,
}: ScheduleAppointmentModalProps) {
  const { open: notify } = useNotification();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [contactId, setContactId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentType, setAppointmentType] = useState<AppointmentType | "">("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [notes, setNotes] = useState("");
  const [recordingMode, setRecordingMode] = useState<"url" | "file">("url");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const linkedContacts = lead ? contacts.filter((c) => c.companyId === lead.companyId) : [];

  // Reset form when lead changes
  useEffect(() => {
    if (lead && open) {
      setContactId(mainContactId ?? "");
      setAppointmentDate(undefined);
      setAppointmentTime("09:00");
      setAppointmentType("");
      setEmailSubject("");
      setEmailBody("");
      setNotes("");
      setRecordingMode("url");
      setRecordingUrl("");
      setErrors({});
    }
  }, [lead, open, mainContactId]);

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!appointmentDate) e.appointmentDate = "La date est obligatoire";
    if (!appointmentType) e.appointmentType = "Le type de rendez-vous est obligatoire";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!lead || !validate()) return;
    setIsLoading(true);

    try {
      // Build ISO datetime from date + time
      const [hours, minutes] = appointmentTime.split(":").map(Number);
      const dt = new Date(appointmentDate!);
      dt.setHours(hours, minutes, 0, 0);
      const isoDate = dt.toISOString();

      // 1. Save appointment record
      await dataProvider.create({
        resource: "appointments",
        variables: {
          leadId: lead.id,
          companyId: lead.companyId ?? null,
          contactId: contactId ? Number(contactId) : null,
          appointmentDate: isoDate,
          appointmentType: appointmentType as AppointmentType,
          emailSubject: emailSubject.trim(),
          emailBody: emailBody.trim(),
          notes: notes.trim(),
          callRecordingUrl: recordingMode === "url" && recordingUrl.trim() ? recordingUrl.trim() : null,
          createdAt: new Date().toISOString(),
        },
      });

      // 2. Update lead stage to pre-scheduled
      await dataProvider.update({
        resource: "leads",
        id: lead.id,
        variables: { stage: "pre-scheduled" },
      });

      // 3. Toast
      notify?.({
        type: "success",
        message: "Rendez-vous planifié",
        description: `RDV ${appointmentType} le ${format(dt, "d MMMM yyyy 'à' HH:mm", { locale: fr })} — ${lead.prenom} ${lead.nom}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("[ScheduleAppointmentModal] Error:", err);
      notify?.({
        type: "error",
        message: "Erreur",
        description: "Une erreur est survenue lors de la planification du rendez-vous.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isValid = !!appointmentDate && !!appointmentType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
            Planifier un rendez-vous
          </DialogTitle>
          {lead && (
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">
                {lead.civilite} {lead.prenom} {lead.nom}
              </span>{" "}
              — {lead.societe}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 space-y-5">
            {/* ── Read-only links ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Lead (lien)
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border text-sm">
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {lead?.numeroUnique ?? "—"}
                  </Badge>
                  <span className="truncate text-muted-foreground text-xs">{lead?.societe}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Société (lien)
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border text-sm">
                  <span className="truncate text-muted-foreground text-xs">
                    {lead?.societe ?? <span className="italic">Non liée</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Contact principal ───────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact principal</Label>
              {linkedContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-3 py-2 rounded-md bg-muted/30 border">
                  Aucun contact lié à cette société.
                </p>
              ) : (
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Sélectionner un contact…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun contact</SelectItem>
                    {linkedContacts.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.civilite} {c.prenom} {c.nom}
                        {c.fonction ? ` — ${c.fonction}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* ── Date + Time ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Date du RDV <span className="text-destructive">*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !appointmentDate && "text-muted-foreground",
                        errors.appointmentDate && "border-destructive",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {appointmentDate ? format(appointmentDate, "d MMM yyyy", { locale: fr }) : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={appointmentDate}
                      onSelect={(d) => {
                        setAppointmentDate(d);
                        setCalendarOpen(false);
                        if (errors.appointmentDate) setErrors((e) => ({ ...e, appointmentDate: "" }));
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.appointmentDate && <p className="text-xs text-destructive">{errors.appointmentDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appointmentTime">Heure</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* ── Appointment Type ────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label>
                Type de rendez-vous <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {APPOINTMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setAppointmentType(t.value);
                      if (errors.appointmentType) setErrors((e) => ({ ...e, appointmentType: "" }));
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-sm font-medium transition-all",
                      appointmentType === t.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-border hover:border-primary/50 hover:bg-muted/40",
                    )}>
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
              {errors.appointmentType && <p className="text-xs text-destructive">{errors.appointmentType}</p>}
            </div>

            {/* ── Email section ───────────────────────────────────────────── */}
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contexte email</p>
              <div className="space-y-1.5">
                <Label htmlFor="emailSubject">Objet</Label>
                <Input
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Ex: Proposition commerciale — Réunion du 28 juin"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emailBody">Corps du message</Label>
                <Textarea
                  id="emailBody"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Contenu ou contexte de l'email de confirmation…"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* ── Notes ──────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes internes sur ce rendez-vous…"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* ── Call Recording ──────────────────────────────────────────── */}
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Enregistrement d'appel (optionnel)
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link className="h-3 w-3" />
                  <span>URL</span>
                  <Switch
                    checked={recordingMode === "file"}
                    onCheckedChange={(v) => setRecordingMode(v ? "file" : "url")}
                    className="scale-75"
                  />
                  <Upload className="h-3 w-3" />
                  <span>Fichier</span>
                </div>
              </div>
              {recordingMode === "url" ? (
                <Input
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://enregistrement.exemple.fr/appel-123"
                  type="url"
                />
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg py-6 px-4 text-center cursor-pointer hover:border-primary/40 transition-colors bg-background">
                  <div className="space-y-1">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cliquez pour sélectionner un fichier audio</p>
                    <p className="text-xs text-muted-foreground/60">MP3, WAV, M4A — max 50 MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading} className="gap-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            {isLoading ? "Enregistrement…" : "Planifier le rendez-vous"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
