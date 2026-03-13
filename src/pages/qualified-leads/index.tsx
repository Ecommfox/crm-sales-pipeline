import { useState, useMemo } from "react";
import { useList, useCreate, useUpdate, useInvalidate } from "@refinedev/core";
import { Lead, Contact, CallLog } from "@/types";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Filter, SlidersHorizontal, UserPlus, Star, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleAppointmentModal } from "@/components/schedule-appointment-modal";
import { ScoreBadge } from "@/components/score-badge";
import {
  getQualificationMap,
  saveQualificationMap,
  getQualData as getQualDataFromStore,
  calculateScore,
  type QualificationData,
  type QualificationMap,
} from "@/lib/scoring";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterestLevel = "Faible" | "Moyen" | "Élevé";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALL_RESULTS = [
  "Ignoré",
  "Répondeur",
  "Barrage secrétaire",
  "Non décroché",
  "Non appelé",
  "Numéro non attribué",
  "Liste noire",
];

const CALL_TYPES = ["Normal", "Qualification", "Rappel", "Rendez-vous", "Relance", "Closing"];

const PAIN_POINTS_OPTIONS = [
  "Coûts élevés",
  "Manque de visibilité",
  "Problèmes de croissance",
  "Concurrence forte",
  "Ressources limitées",
  "Digitalisation difficile",
  "Fidélisation clients",
  "Recrutement",
  "Gestion administrative",
  "Productivité",
  "Sécurité",
  "Conformité réglementaire",
];

const CALL_RESULT_COLORS: Record<string, string> = {
  Ignoré: "bg-gray-100 text-gray-700",
  Répondeur: "bg-yellow-100 text-yellow-700",
  "Barrage secrétaire": "bg-orange-100 text-orange-700",
  "Non décroché": "bg-red-100 text-red-700",
  "Non appelé": "bg-slate-100 text-slate-700",
  "Numéro non attribué": "bg-red-200 text-red-800",
  "Liste noire": "bg-black text-white",
};

const INTEREST_COLORS: Record<InterestLevel, string> = {
  Faible: "bg-red-100 text-red-700",
  Moyen: "bg-yellow-100 text-yellow-700",
  Élevé: "bg-green-100 text-green-700",
};

const ALL_COLUMNS: { key: string; label: string }[] = [
  { key: "societe", label: "Société" },
  { key: "siret", label: "Siret" },
  { key: "activite", label: "Activité" },
  { key: "civilite", label: "Civilité" },
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "fonction", label: "Fonction" },
  { key: "adresse", label: "Adresse" },
  { key: "codePostal", label: "Code Postal" },
  { key: "ville", label: "Ville" },
  { key: "telephoneFixe", label: "Tél. fixe" },
  { key: "telephonePortable", label: "Tél. portable" },
  { key: "mail", label: "Mail" },
  { key: "dateHeureAppel", label: "Date/heure appel" },
  { key: "etatAppel", label: "État appel" },
  { key: "commentaire", label: "Commentaire" },
  { key: "numeroUnique", label: "Numéro unique" },
  { key: "teleoperateur", label: "Téléopérateur" },
  { key: "interestLevel", label: "Intérêt" },
  { key: "painPoints", label: "Pain Points" },
  { key: "identifiedNeeds", label: "Besoins identifiés" },
  { key: "openForAppointment", label: "Ouvert RDV" },
  { key: "mainContact", label: "Contact principal" },
  { key: "score", label: "Score" },
];

const DEFAULT_VISIBLE = new Set([
  "societe",
  "nom",
  "prenom",
  "ville",
  "telephoneFixe",
  "etatAppel",
  "interestLevel",
  "painPoints",
  "openForAppointment",
  "mainContact",
  "score",
]);

// ─── Log Call Modal ────────────────────────────────────────────────────────────

function LogCallModal({ lead, open, onClose }: { lead: Lead | null; open: boolean; onClose: () => void }) {
  const { mutate: createCallLog } = useCreate();
  const { mutate: updateLead } = useUpdate();
  const invalidate = useInvalidate();

  const [callResult, setCallResult] = useState("");
  const [callType, setCallType] = useState("Normal");
  const [comment, setComment] = useState("");
  const [newStage, setNewStage] = useState("");

  const handleSubmit = () => {
    if (!lead || !callResult) return;
    const now = new Date().toISOString();
    createCallLog({
      resource: "callLogs",
      values: {
        leadId: lead.id,
        callResult,
        callType: callType,
        comment,
        date: now,
        teleoperator: "Opérateur actuel",
        leadStatusAfter: newStage || lead.stage,
      },
    });
    updateLead({
      resource: "leads",
      id: lead.id,
      values: {
        etatAppel: callResult,
        commentaireTeleoperateur: comment,
        dateHeureAppel: now,
        ...(newStage ? { stage: newStage } : {}),
      },
    });
    invalidate({ resource: "leads", invalidates: ["list"] });
    setCallResult("");
    setCallType("Normal");
    setComment("");
    setNewStage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Logger un appel — {lead?.prenom} {lead?.nom}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>
              Résultat de l'appel <span className="text-red-500">*</span>
            </Label>
            <Select value={callResult} onValueChange={setCallResult}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un résultat" />
              </SelectTrigger>
              <SelectContent>
                {CALL_RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type d'appel</Label>
            <Select value={callType} onValueChange={setCallType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nouveau statut du lead</Label>
            <Select value={newStage} onValueChange={setNewStage}>
              <SelectTrigger>
                <SelectValue placeholder="(Pas de changement)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Pas de changement</SelectItem>
                <SelectItem value="none">Aucun</SelectItem>
                <SelectItem value="pre-qualified">Pré-qualifié</SelectItem>
                <SelectItem value="qualified">Qualifié</SelectItem>
                <SelectItem value="pre-scheduled">Pré-planifié</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Commentaire</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notes sur l'appel..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!callResult}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Qualification Drawer ─────────────────────────────────────────────────────

function QualificationDrawer({
  lead,
  open,
  onClose,
  initialData,
  contacts,
  onSave,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  initialData: QualificationData;
  contacts: Contact[];
  onSave: (data: QualificationData) => void;
}) {
  const [form, setForm] = useState<QualificationData>(initialData);
  const linkedContacts = lead ? contacts.filter((c) => c.companyId === lead.companyId) : [];

  const togglePainPoint = (pp: string) => {
    setForm((prev) => ({
      ...prev,
      painPoints: prev.painPoints.includes(pp) ? prev.painPoints.filter((x) => x !== pp) : [...prev.painPoints, pp],
    }));
  };

  const handleOpen = (v: boolean) => {
    if (v) setForm(initialData);
    else onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent className="w-[420px] sm:w-[480px] flex flex-col">
        <SheetHeader>
          <SheetTitle>
            Qualification — {lead?.prenom} {lead?.nom}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{lead?.societe}</p>
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-5 pr-4">
            <div className="space-y-1.5">
              <Label>Niveau d'intérêt</Label>
              <Select
                value={form.interestLevel}
                onValueChange={(v) => setForm((p) => ({ ...p, interestLevel: v as InterestLevel }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Faible">Faible</SelectItem>
                  <SelectItem value="Moyen">Moyen</SelectItem>
                  <SelectItem value="Élevé">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Points de douleur</Label>
              <div className="flex flex-wrap gap-2">
                {PAIN_POINTS_OPTIONS.map((pp) => (
                  <button
                    key={pp}
                    type="button"
                    onClick={() => togglePainPoint(pp)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs border transition-colors",
                      form.painPoints.includes(pp)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50",
                    )}>
                    {pp}
                  </button>
                ))}
              </div>
              {form.painPoints.length > 0 && (
                <p className="text-xs text-muted-foreground">{form.painPoints.length} sélectionné(s)</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Besoins identifiés</Label>
              <Textarea
                value={form.identifiedNeeds}
                onChange={(e) => setForm((p) => ({ ...p, identifiedNeeds: e.target.value }))}
                placeholder="Décrire les besoins identifiés..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ouvert pour un rendez-vous ?</Label>
              <div className="flex gap-3">
                {(
                  [
                    { label: "Oui", value: true },
                    { label: "Non", value: false },
                    { label: "Non défini", value: null },
                  ] as const
                ).map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, openForAppointment: value }))}
                    className={cn(
                      "flex-1 py-2 rounded-md border text-sm font-medium transition-colors",
                      form.openForAppointment === value
                        ? value === true
                          ? "bg-green-500 text-white border-green-500"
                          : value === false
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-muted border-border"
                        : "bg-background border-border hover:bg-muted/50",
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Contact principal</Label>
              {linkedContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucun contact lié à cette société.</p>
              ) : (
                <Select value={form.mainContactId} onValueChange={(v) => setForm((p) => ({ ...p, mainContactId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedContacts.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.civilite} {c.prenom} {c.nom} — {c.fonction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button variant="outline">Annuler</Button>
          </SheetClose>
          <Button
            onClick={() => {
              onSave(form);
              onClose();
            }}>
            Sauvegarder
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────

function AddContactModal({ lead, open, onClose }: { lead: Lead | null; open: boolean; onClose: () => void }) {
  const { mutate: createContact } = useCreate();
  const invalidate = useInvalidate();
  const [form, setForm] = useState({
    civilite: "M.",
    prenom: "",
    nom: "",
    fonction: "",
    mail: "",
    telephonePortable: "",
  });

  const handleSubmit = () => {
    if (!lead || !form.nom) return;
    createContact({ resource: "contacts", values: { ...form, companyId: lead.companyId } });
    invalidate({ resource: "contacts", invalidates: ["list"] });
    setForm({ civilite: "M.", prenom: "", nom: "", fonction: "", mail: "", telephonePortable: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un contact — {lead?.societe}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <div className="w-24 space-y-1">
              <Label>Civilité</Label>
              <Select value={form.civilite} onValueChange={(v) => setForm((p) => ({ ...p, civilite: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M.">M.</SelectItem>
                  <SelectItem value="Mme">Mme</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label>Prénom</Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                placeholder="Prénom"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label>
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Nom"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Fonction</Label>
            <Input
              value={form.fonction}
              onChange={(e) => setForm((p) => ({ ...p, fonction: e.target.value }))}
              placeholder="Directeur commercial..."
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.mail}
              onChange={(e) => setForm((p) => ({ ...p, mail: e.target.value }))}
              placeholder="contact@societe.fr"
            />
          </div>
          <div className="space-y-1">
            <Label>Téléphone portable</Label>
            <Input
              value={form.telephonePortable}
              onChange={(e) => setForm((p) => ({ ...p, telephonePortable: e.target.value }))}
              placeholder="06 xx xx xx xx"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!form.nom}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function QualifiedLeadsPage() {
  const { result: leadsResult } = useList<Lead>({ resource: "leads", pagination: { pageSize: 1000 } });
  const { result: contactsResult } = useList<Contact>({ resource: "contacts", pagination: { pageSize: 1000 } });
  const { result: callLogsResult } = useList<CallLog>({ resource: "callLogs", pagination: { pageSize: 10000 } });

  const allLeads: Lead[] = leadsResult?.data ?? [];
  const contacts: Contact[] = contactsResult?.data ?? [];
  const allCallLogs: CallLog[] = callLogsResult?.data ?? [];

  const qualifiedLeads = useMemo(() => allLeads.filter((l: Lead) => l.stage === "qualified"), [allLeads]);

  const [qualificationMap, setQualificationMap] = useState<QualificationMap>(getQualificationMap);

  const [logCallLead, setLogCallLead] = useState<Lead | null>(null);
  const [qualLead, setQualLead] = useState<Lead | null>(null);
  const [addContactLead, setAddContactLead] = useState<Lead | null>(null);
  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null);
  const invalidate = useInvalidate();

  const [filterVille, setFilterVille] = useState("");
  const [filterActivite, setFilterActivite] = useState("");
  const [filterEtatAppel, setFilterEtatAppel] = useState("");
  const [filterOpenForAppointment, setFilterOpenForAppointment] = useState("");
  const [filterInterestLevel, setFilterInterestLevel] = useState("");
  const [filterUncontacted, setFilterUncontacted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(DEFAULT_VISIBLE));

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const villes = useMemo(
    () => [...new Set(qualifiedLeads.map((l: Lead) => l.ville).filter((v): v is string => !!v))].sort(),
    [qualifiedLeads],
  );
  const activites = useMemo(
    () => [...new Set(qualifiedLeads.map((l: Lead) => l.activite).filter((v): v is string => !!v))].sort(),
    [qualifiedLeads],
  );

  const filteredLeads = useMemo(() => {
    return qualifiedLeads.filter((lead: Lead) => {
      const qual = qualificationMap[lead.id];
      if (filterVille && lead.ville !== filterVille) return false;
      if (filterActivite && lead.activite !== filterActivite) return false;
      if (filterEtatAppel && lead.etatAppel !== filterEtatAppel) return false;
      if (filterUncontacted && lead.etatAppel && lead.etatAppel !== "Non appelé") return false;
      if (filterInterestLevel && (qual?.interestLevel ?? "") !== filterInterestLevel) return false;
      if (filterOpenForAppointment === "oui" && qual?.openForAppointment !== true) return false;
      if (filterOpenForAppointment === "non" && qual?.openForAppointment !== false) return false;
      return true;
    });
  }, [
    qualifiedLeads,
    qualificationMap,
    filterVille,
    filterActivite,
    filterEtatAppel,
    filterUncontacted,
    filterInterestLevel,
    filterOpenForAppointment,
  ]);

  const activeFilterCount =
    [filterVille, filterActivite, filterEtatAppel, filterInterestLevel, filterOpenForAppointment].filter(Boolean)
      .length + (filterUncontacted ? 1 : 0);

  const getQualData = (leadId: number): QualificationData => getQualDataFromStore(leadId, qualificationMap);

  const saveQualData = (leadId: number, data: QualificationData) => {
    setQualificationMap((prev) => {
      const next = { ...prev, [leadId]: data };
      saveQualificationMap(next);
      return next;
    });
  };

  const getMainContactName = (lead: Lead) => {
    const qual = getQualData(lead.id);
    if (!qual.mainContactId) return "—";
    const c = contacts.find((x: Contact) => String(x.id) === qual.mainContactId);
    return c ? `${c.prenom} ${c.nom}` : "—";
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCell = (key: string, lead: Lead) => {
    const qual = getQualData(lead.id);
    switch (key) {
      case "societe":
        return <span className="font-medium">{lead.societe ?? "—"}</span>;
      case "siret":
        return <span className="font-mono text-xs">{lead.siret ?? "—"}</span>;
      case "activite":
        return lead.activite ?? "—";
      case "civilite":
        return lead.civilite ?? "—";
      case "nom":
        return lead.nom ?? "—";
      case "prenom":
        return lead.prenom ?? "—";
      case "fonction":
        return lead.fonction ?? "—";
      case "adresse":
        return <span className="max-w-[140px] truncate block">{lead.adresse ?? "—"}</span>;
      case "codePostal":
        return lead.codePostal ?? "—";
      case "ville":
        return lead.ville ?? "—";
      case "telephoneFixe":
        return (
          <a href={`tel:${lead.telephoneFixe}`} className="text-primary hover:underline">
            {lead.telephoneFixe ?? "—"}
          </a>
        );
      case "telephonePortable":
        return (
          <a href={`tel:${lead.telephonePortable}`} className="text-primary hover:underline">
            {lead.telephonePortable ?? "—"}
          </a>
        );
      case "mail":
        return lead.mail ? (
          <a href={`mailto:${lead.mail}`} className="text-primary hover:underline">
            {lead.mail}
          </a>
        ) : (
          "—"
        );
      case "dateHeureAppel":
        return <span className="text-xs">{formatDate(lead.dateHeureAppel)}</span>;
      case "etatAppel":
        return lead.etatAppel ? (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              CALL_RESULT_COLORS[lead.etatAppel] ?? "bg-gray-100 text-gray-700",
            )}>
            {lead.etatAppel}
          </span>
        ) : (
          "—"
        );
      case "commentaire":
        return (
          <span className="max-w-[160px] truncate block text-xs text-muted-foreground">
            {lead.commentaireTeleoperateur ?? "—"}
          </span>
        );
      case "numeroUnique":
        return <span className="font-mono text-xs">{lead.numeroUnique ?? "—"}</span>;
      case "teleoperateur":
        return lead.teleoperateurAppel ?? "—";
      case "interestLevel":
        return qual.interestLevel ? (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              INTEREST_COLORS[qual.interestLevel as InterestLevel],
            )}>
            {qual.interestLevel}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case "painPoints":
        return qual.painPoints?.length ? (
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {qual.painPoints.slice(0, 2).map((pp) => (
              <span key={pp} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
                {pp}
              </span>
            ))}
            {qual.painPoints.length > 2 && (
              <span className="text-xs text-muted-foreground">+{qual.painPoints.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case "identifiedNeeds":
        return <span className="max-w-[140px] truncate block text-xs">{qual.identifiedNeeds || "—"}</span>;
      case "openForAppointment":
        return qual.openForAppointment === true ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Oui</Badge>
        ) : qual.openForAppointment === false ? (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Non</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case "mainContact":
        return <span className="text-xs">{getMainContactName(lead)}</span>;
      case "score": {
        const qual = getQualData(lead.id);
        const callCount = allCallLogs.filter((l: CallLog) => String(l.leadId) === String(lead.id)).length;
        const score = calculateScore(qual, callCount);
        return <ScoreBadge score={score} />;
      }
      default:
        return "—";
    }
  };

  return (
    <ListView>
      <ListViewHeader title={`Leads Qualifiés (${filteredLeads.length})`} canCreate={false} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterUncontacted((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
            filterUncontacted
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted/50",
          )}>
          Non contactés
        </button>

        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.has(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}>
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              setFilterVille("");
              setFilterActivite("");
              setFilterEtatAppel("");
              setFilterInterestLevel("");
              setFilterOpenForAppointment("");
              setFilterUncontacted(false);
            }}>
            <X className="h-3.5 w-3.5" /> Effacer filtres
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 border rounded-lg bg-muted/20">
          <div className="space-y-1">
            <Label className="text-xs">État appel</Label>
            <Select value={filterEtatAppel} onValueChange={setFilterEtatAppel}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tous</SelectItem>
                {CALL_RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ville</Label>
            <Select value={filterVille} onValueChange={setFilterVille}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Toutes</SelectItem>
                {villes.map((v: string) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Activité</Label>
            <Select value={filterActivite} onValueChange={setFilterActivite}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Toutes</SelectItem>
                {activites.map((a: string) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Intérêt</Label>
            <Select value={filterInterestLevel} onValueChange={setFilterInterestLevel}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tous</SelectItem>
                <SelectItem value="Faible">Faible</SelectItem>
                <SelectItem value="Moyen">Moyen</SelectItem>
                <SelectItem value="Élevé">Élevé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ouvert RDV</Label>
            <Select value={filterOpenForAppointment} onValueChange={setFilterOpenForAppointment}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tous</SelectItem>
                <SelectItem value="oui">Oui</SelectItem>
                <SelectItem value="non">Non</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                <TableHead key={col.key} className="whitespace-nowrap text-xs font-semibold px-3 py-2">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-xs font-semibold px-3 py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.size + 1} className="text-center py-12 text-muted-foreground">
                  Aucun lead qualifié trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead: Lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                  {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                    <TableCell key={col.key} className="px-3 py-2 text-sm whitespace-nowrap">
                      {renderCell(col.key, lead)}
                    </TableCell>
                  ))}
                  <TableCell className="px-3 py-2 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Logger un appel"
                        onClick={() => setLogCallLead(lead)}>
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Qualification"
                        onClick={() => setQualLead(lead)}>
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Planifier RDV"
                        onClick={() => setScheduleLead(lead)}>
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Ajouter contact"
                        onClick={() => setAddContactLead(lead)}>
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <LogCallModal lead={logCallLead} open={!!logCallLead} onClose={() => setLogCallLead(null)} />
      {qualLead && (
        <QualificationDrawer
          lead={qualLead}
          open={!!qualLead}
          onClose={() => setQualLead(null)}
          initialData={getQualData(qualLead.id)}
          contacts={contacts}
          onSave={(data) => saveQualData(qualLead.id, data)}
        />
      )}
      <AddContactModal lead={addContactLead} open={!!addContactLead} onClose={() => setAddContactLead(null)} />
      <ScheduleAppointmentModal
        lead={scheduleLead}
        open={!!scheduleLead}
        onOpenChange={(open) => {
          if (!open) setScheduleLead(null);
        }}
        onSuccess={() => {
          invalidate({ resource: "leads", invalidates: ["list"] });
          invalidate({ resource: "appointments", invalidates: ["list"] });
          setScheduleLead(null);
        }}
        contacts={contacts}
        mainContactId={scheduleLead ? getQualData(scheduleLead.id).mainContactId : undefined}
      />
    </ListView>
  );
}
