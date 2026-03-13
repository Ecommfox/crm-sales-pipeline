import { useState, useMemo } from "react";
import { useShow, useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Hash,
  Users,
  Briefcase,
  PhoneCall,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ScoreBadge } from "@/components/score-badge";
import type { Company, Contact, Lead, CallLog, Stage, CallResult } from "@/types";

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<Stage, { label: string; badgeClass: string }> = {
  none: {
    label: "Nouveau",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  },
  "pre-qualified": {
    label: "Pré-qualifié",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
  },
  qualified: {
    label: "Qualifié",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300",
  },
  "pre-scheduled": {
    label: "RDV planifié",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300",
  },
  confirmed: {
    label: "RDV confirmé",
    badgeClass: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300",
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

const CIVILITE_OPTIONS = ["M.", "Mme", "Dr.", "Me", "Pr."];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  count,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 rounded-t-lg">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count !== undefined && (
          <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
            {count}
          </Badge>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Field display ─────────────────────────────────────────────────────────────

function Field({ label, value, href, mono }: { label: string; value?: string | null; href?: string; mono?: boolean }) {
  const display = value || "—";
  return (
    <div className="space-y-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {href && value ? (
        <a href={href} className={`text-sm text-blue-600 hover:underline block ${mono ? "font-mono" : ""}`}>
          {display}
        </a>
      ) : (
        <p className={`text-sm ${mono ? "font-mono" : ""} ${!value ? "text-muted-foreground" : "text-foreground"}`}>
          {display}
        </p>
      )}
    </div>
  );
}

// ── Contact form modal ────────────────────────────────────────────────────────

interface ContactFormData {
  civilite: string;
  nom: string;
  prenom: string;
  fonction: string;
  mail: string;
  telephonePortable: string;
}

const emptyContact: ContactFormData = {
  civilite: "M.",
  nom: "",
  prenom: "",
  fonction: "",
  mail: "",
  telephonePortable: "",
};

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  initialData?: Contact | null;
  onSuccess: () => void;
}

function ContactFormModal({ open, onOpenChange, companyId, initialData, onSuccess }: ContactFormModalProps) {
  const isEdit = !!initialData;
  const {
    mutate: create,
    mutation: { isPending: creating },
  } = useCreate();
  const {
    mutate: update,
    mutation: { isPending: updating },
  } = useUpdate();

  const [form, setForm] = useState<ContactFormData>(
    initialData
      ? {
          civilite: initialData.civilite,
          nom: initialData.nom,
          prenom: initialData.prenom,
          fonction: initialData.fonction,
          mail: initialData.mail,
          telephonePortable: initialData.telephonePortable,
        }
      : emptyContact,
  );
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  useMemo(() => {
    if (open) {
      setForm(
        initialData
          ? {
              civilite: initialData.civilite,
              nom: initialData.nom,
              prenom: initialData.prenom,
              fonction: initialData.fonction,
              mail: initialData.mail,
              telephonePortable: initialData.telephonePortable,
            }
          : emptyContact,
      );
      setErrors({});
    }
  }, [open, initialData]);

  function validate() {
    const errs: Partial<ContactFormData> = {};
    if (!form.nom.trim()) errs.nom = "Le nom est requis.";
    if (!form.prenom.trim()) errs.prenom = "Le prénom est requis.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (isEdit && initialData) {
      update(
        { resource: "contacts", id: initialData.id, values: { ...form, companyId } },
        {
          onSuccess: () => {
            onSuccess();
            onOpenChange(false);
          },
        },
      );
    } else {
      create(
        { resource: "contacts", values: { ...form, companyId } },
        {
          onSuccess: () => {
            onSuccess();
            onOpenChange(false);
          },
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le contact" : "Ajouter un contact"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations du contact." : "Renseignez les informations du nouveau contact."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Civilité</Label>
            <Select value={form.civilite} onValueChange={(v) => setForm((f) => ({ ...f, civilite: v }))}>
              <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                className={errors.prenom ? "border-destructive" : ""}
              />
              {errors.prenom && <p className="text-xs text-destructive">{errors.prenom}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className={errors.nom ? "border-destructive" : ""}
              />
              {errors.nom && <p className="text-xs text-destructive">{errors.nom}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Fonction</Label>
            <Input value={form.fonction} onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Mail</Label>
            <Input type="email" value={form.mail} onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Téléphone portable</Label>
            <Input
              value={form.telephonePortable}
              onChange={(e) => setForm((f) => ({ ...f, telephonePortable: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={creating || updating}>
            {creating || updating ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CompanyShowPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Company data
  const { query } = useShow<Company>({ resource: "companies", id });
  const company = query.data?.data;
  const isLoading = query.isLoading;

  // All contacts
  const { query: contactsQuery } = useList<Contact>({
    resource: "contacts",
    pagination: { pageSize: 1000 },
  });
  const allContacts: Contact[] = contactsQuery.data?.data ?? [];
  const companyContacts = allContacts.filter((c) => String(c.companyId) === String(id));

  // All leads
  const { query: leadsQuery } = useList<Lead>({
    resource: "leads",
    pagination: { pageSize: 1000 },
  });
  const allLeads: Lead[] = leadsQuery.data?.data ?? [];
  const companyLeads = allLeads.filter((l) => String(l.companyId) === String(id));

  // All call logs — filter to those from company leads
  const { query: callLogsQuery } = useList<CallLog>({
    resource: "callLogs",
    pagination: { pageSize: 1000 },
  });
  const allCallLogs: CallLog[] = callLogsQuery.data?.data ?? [];
  const companyLeadIds = new Set(companyLeads.map((l) => l.id));
  const companyCallLogs = allCallLogs
    .filter((log) => companyLeadIds.has(log.leadId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Contact modal state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Delete contact state
  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const { mutate: deleteContact } = useDelete();

  function handleAddContact() {
    setEditingContact(null);
    setContactModalOpen(true);
  }

  function handleEditContact(contact: Contact) {
    setEditingContact(contact);
    setContactModalOpen(true);
  }

  function handleDeleteContactRequest(contact: Contact) {
    setDeleteContactTarget(contact);
    setDeleteAlertOpen(true);
  }

  function confirmDeleteContact() {
    if (!deleteContactTarget) return;
    deleteContact(
      { resource: "contacts", id: deleteContactTarget.id },
      {
        onSuccess: () => {
          contactsQuery.refetch();
          setDeleteAlertOpen(false);
          setDeleteContactTarget(null);
        },
      },
    );
  }

  function handleContactSuccess() {
    contactsQuery.refetch();
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Société introuvable.</p>
        <Button variant="outline" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Sociétés
        </Button>
      </div>
    );
  }

  // ── Lead name helper ─────────────────────────────────────────────────────

  function getLeadName(leadId: number) {
    const lead = allLeads.find((l) => l.id === leadId);
    return lead ? `${lead.prenom} ${lead.nom}` : `Lead #${leadId}`;
  }

  return (
    <div className="flex flex-col h-full overflow-auto bg-muted/20">
      {/* ── Top header bar ── */}
      <div className="sticky top-0 z-20 border-b bg-background shadow-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          {/* Back */}
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/companies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Company name + details */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate leading-tight">{company.societe}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{company.siret}</span>
              </div>
            </div>
          </div>

          {/* Activité badge */}
          <Badge variant="outline" className="shrink-0 text-xs font-medium px-2.5">
            {company.activite}
          </Badge>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddContact}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ajouter un contact</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/leads?companyId=${company.id}`)}>
              <Briefcase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voir les leads</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/companies`)}>
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 items-start">
        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Informations société */}
          <Section icon={Building2} title="Informations société">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Raison sociale" value={company.societe} />
              <Field label="SIRET" value={company.siret} mono />
              <div className="col-span-2">
                <Field label="Activité" value={company.activite} />
              </div>
            </div>
          </Section>

          {/* Localisation & Contact */}
          <Section icon={MapPin} title="Adresse & Contact">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <Field label="Adresse" value={company.adresse} />
              </div>
              <Field label="Code Postal" value={company.codePostal} />
              <Field label="Ville" value={company.ville} />
              <div className="col-span-2">
                <Field label="Téléphone" value={company.telephone} href={`tel:${company.telephone}`} />
              </div>
            </div>
          </Section>

          {/* Contacts liés */}
          <Section
            icon={Users}
            title="Contacts"
            count={companyContacts.length}
            action={
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleAddContact}>
                <Plus className="h-3 w-3" />
                Ajouter
              </Button>
            }>
            {companyContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun contact lié à cette société.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9 w-[70px]">
                        Civilité
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Nom
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Prénom
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Fonction
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Mail
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Téléphone
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9 w-[80px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyContacts.map((contact) => (
                      <TableRow key={contact.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="py-2 text-sm text-muted-foreground">{contact.civilite}</TableCell>
                        <TableCell className="py-2 text-sm font-medium">{contact.nom}</TableCell>
                        <TableCell className="py-2 text-sm">{contact.prenom}</TableCell>
                        <TableCell className="py-2 text-sm text-muted-foreground">{contact.fonction || "—"}</TableCell>
                        <TableCell className="py-2">
                          {contact.mail ? (
                            <a
                              href={`mailto:${contact.mail}`}
                              className="text-xs text-blue-600 hover:underline block max-w-[180px] truncate">
                              {contact.mail}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          {contact.telephonePortable ? (
                            <a
                              href={`tel:${contact.telephonePortable}`}
                              className="text-xs text-blue-600 hover:underline">
                              {contact.telephonePortable}
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Modifier"
                              onClick={() => handleEditContact(contact)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Supprimer"
                              onClick={() => handleDeleteContactRequest(contact)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>

          {/* Leads liés */}
          <Section icon={Briefcase} title="Leads associés" count={companyLeads.length}>
            {companyLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun lead lié à cette société.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Nom
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Prénom
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Fonction
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        Stage
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9">
                        État appel
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9 w-[60px] text-center">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyLeads.map((lead) => {
                      const stageCfg = STAGE_CONFIG[lead.stage];
                      const resultColor = lead.etatAppel ? CALL_RESULT_COLORS[lead.etatAppel] : "";
                      return (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => navigate(`/leads/${lead.id}`)}>
                          <TableCell className="py-2 text-sm font-medium">{lead.nom}</TableCell>
                          <TableCell className="py-2 text-sm">{lead.prenom}</TableCell>
                          <TableCell className="py-2 text-sm text-muted-foreground">{lead.fonction || "—"}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className={`text-xs font-medium ${stageCfg.badgeClass}`}>
                              {stageCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            {lead.etatAppel ? (
                              <Badge variant="outline" className={`text-xs ${resultColor}`}>
                                {lead.etatAppel}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {lead.score != null ? (
                              <ScoreBadge score={lead.score} size="sm" />
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>
        </div>

        {/* ── Right column (1/3) — Call History ── */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 rounded-t-lg">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Historique des appels</h3>
              {companyCallLogs.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                  {companyCallLogs.length}
                </Badge>
              )}
            </div>
            <div className="p-4">
              {companyCallLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun appel enregistré.</p>
              ) : (
                <div className="space-y-4">
                  {companyCallLogs.map((log, idx) => {
                    const resultColor = CALL_RESULT_COLORS[log.callResult] ?? "bg-gray-100 text-gray-600";
                    const typeColor = CALL_TYPE_COLORS[log.callType] ?? "text-gray-500";
                    const leadName = getLeadName(log.leadId);
                    const leadObj = allLeads.find((l) => l.id === log.leadId);

                    return (
                      <div key={log.id} className="relative flex gap-3">
                        {/* timeline line */}
                        {idx < companyCallLogs.length - 1 && (
                          <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border" />
                        )}
                        {/* icon */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted border flex items-center justify-center mt-0.5 z-10">
                          <PhoneCall className="h-3 w-3 text-muted-foreground" />
                        </div>
                        {/* content */}
                        <div className="flex-1 min-w-0 pb-1">
                          {/* Lead name link */}
                          {leadObj && (
                            <button
                              className="text-xs font-semibold text-primary hover:underline mb-1 flex items-center gap-1"
                              onClick={() => navigate(`/leads/${leadObj.id}`)}>
                              {leadName}
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <Badge variant="outline" className={`text-xs py-0 h-5 ${resultColor}`}>
                              {log.callResult}
                            </Badge>
                            <span className={`text-xs font-medium ${typeColor}`}>{log.callType}</span>
                          </div>
                          {log.comment && (
                            <p className="text-xs text-foreground/80 bg-muted/50 rounded px-2 py-1.5 mb-1">
                              {log.comment}
                            </p>
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
        </div>
      </div>

      {/* Contact form modal */}
      {company && (
        <ContactFormModal
          open={contactModalOpen}
          onOpenChange={(open) => {
            setContactModalOpen(open);
            if (!open) setEditingContact(null);
          }}
          companyId={company.id}
          initialData={editingContact}
          onSuccess={handleContactSuccess}
        />
      )}

      {/* Delete contact alert */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer{" "}
              <strong>
                {deleteContactTarget?.civilite} {deleteContactTarget?.prenom} {deleteContactTarget?.nom}
              </strong>{" "}
              ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
