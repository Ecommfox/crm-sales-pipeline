import { useState, useEffect } from "react";
import { useCreate, useUpdate, useNotification } from "@refinedev/core";
import { Check, ChevronsUpDown, Building2, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import type { Contact, Company, Lead } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactFormData {
  civilite: string;
  nom: string;
  prenom: string;
  fonction: string;
  mail: string;
  telephonePortable: string;
  companyId: string;
  leadId: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

const EMPTY_FORM: ContactFormData = {
  civilite: "M.",
  nom: "",
  prenom: "",
  fonction: "",
  mail: "",
  telephonePortable: "",
  companyId: "",
  leadId: "",
};

const CIVILITE_OPTIONS = ["M.", "Mme", "Dr.", "Me", "Pr."];

// ── Company searchable combobox ────────────────────────────────────────────────

function CompanyCombobox({
  companies,
  value,
  onChange,
  hasError,
}: {
  companies: Company[];
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = companies.find((c) => String(c.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", hasError && "border-destructive")}>
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{selected.societe}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Rechercher une société…</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher par nom…" />
          <CommandList>
            <CommandEmpty>Aucune société trouvée.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}>
                <span className="text-muted-foreground italic">Aucune société</span>
              </CommandItem>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={`${company.societe} ${company.siret} ${company.activite}`}
                  onSelect={() => {
                    onChange(String(company.id));
                    setOpen(false);
                  }}>
                  <Check
                    className={cn("mr-2 h-4 w-4 shrink-0", String(company.id) === value ? "opacity-100" : "opacity-0")}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{company.societe}</p>
                    {company.activite && <p className="text-xs text-muted-foreground truncate">{company.activite}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Lead searchable combobox ───────────────────────────────────────────────────

function LeadCombobox({ leads, value, onChange }: { leads: Lead[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = leads.find((l) => String(l.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selected ? (
            <span className="truncate">
              {selected.civilite} {selected.prenom} {selected.nom} — {selected.societe}
            </span>
          ) : (
            <span className="text-muted-foreground">Aucun lead lié (optionnel)</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un lead…" />
          <CommandList>
            <CommandEmpty>Aucun lead trouvé.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}>
                <span className="text-muted-foreground italic">Aucun</span>
              </CommandItem>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.prenom} ${lead.nom} ${lead.societe}`}
                  onSelect={() => {
                    onChange(String(lead.id));
                    setOpen(false);
                  }}>
                  <Check
                    className={cn("mr-2 h-4 w-4 shrink-0", String(lead.id) === value ? "opacity-100" : "opacity-0")}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {lead.civilite} {lead.prenom} {lead.nom}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{lead.societe}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, form is in edit mode pre-filled with this data */
  initialData?: Contact | null;
  /** Pre-set company ID (e.g., when adding contact from company detail page) */
  defaultCompanyId?: string;
  /** List of companies for the company selector */
  companies: Company[];
  /** List of leads for the lead selector (optional) */
  leads?: Lead[];
  /** Called after a successful create or update */
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactFormModal({
  open,
  onOpenChange,
  initialData,
  defaultCompanyId,
  companies,
  leads = [],
  onSuccess,
}: ContactFormModalProps) {
  const isEdit = !!initialData;
  const { open: notify } = useNotification();

  const {
    mutate: create,
    mutation: { isPending: creating },
  } = useCreate();
  const {
    mutate: update,
    mutation: { isPending: updating },
  } = useUpdate();
  const isPending = creating || updating;

  const [form, setForm] = useState<ContactFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});

  // Populate / reset form when modal opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          civilite: initialData.civilite ?? "M.",
          nom: initialData.nom ?? "",
          prenom: initialData.prenom ?? "",
          fonction: initialData.fonction ?? "",
          mail: initialData.mail ?? "",
          telephonePortable: initialData.telephonePortable ?? "",
          companyId: initialData.companyId ? String(initialData.companyId) : "",
          leadId: "",
        });
      } else {
        setForm({
          ...EMPTY_FORM,
          companyId: defaultCompanyId ? String(defaultCompanyId) : "",
        });
      }
      setErrors({});
    }
  }, [open, initialData, defaultCompanyId]);

  // ── Field helpers ──────────────────────────────────────────────────────────

  function setField<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: ContactFormErrors = {};
    if (!form.nom.trim()) errs.nom = "Le nom est requis.";
    if (!form.prenom.trim()) errs.prenom = "Le prénom est requis.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!validate()) return;

    const values = {
      civilite: form.civilite,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      fonction: form.fonction.trim(),
      mail: form.mail.trim(),
      telephonePortable: form.telephonePortable.trim(),
      companyId: form.companyId || null,
    };

    const contactLabel = `${form.prenom} ${form.nom}`;

    if (isEdit && initialData) {
      update(
        { resource: "contacts", id: initialData.id, values },
        {
          onSuccess: () => {
            notify?.({
              type: "success",
              message: "Contact mis à jour",
              description: `${contactLabel} a été modifié avec succès.`,
            });
            onSuccess?.();
            onOpenChange(false);
          },
          onError: () => {
            notify?.({ type: "error", message: "Erreur", description: "Impossible de modifier le contact." });
          },
        },
      );
    } else {
      create(
        { resource: "contacts", values },
        {
          onSuccess: () => {
            notify?.({
              type: "success",
              message: "Contact ajouté",
              description: `${contactLabel} a été créé avec succès.`,
            });
            onSuccess?.();
            onOpenChange(false);
          },
          onError: () => {
            notify?.({ type: "error", message: "Erreur", description: "Impossible de créer le contact." });
          },
        },
      );
    }
  }

  const title = isEdit ? `Modifier — ${initialData?.prenom} ${initialData?.nom}` : "Ajouter un contact";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations du contact." : "Renseignez les informations du nouveau contact."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[68vh] pr-1">
          <div className="space-y-4 py-1 pr-2">
            {/* Civilité + Prénom + Nom */}
            <div className="grid grid-cols-[90px_1fr_1fr] gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Civilité</Label>
                <Select value={form.civilite} onValueChange={(v) => setField("civilite", v)}>
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

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Prénom <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.prenom}
                  onChange={(e) => setField("prenom", e.target.value)}
                  placeholder="Prénom"
                  className={errors.prenom ? "border-destructive" : ""}
                />
                {errors.prenom && <p className="text-xs text-destructive">{errors.prenom}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.nom}
                  onChange={(e) => setField("nom", e.target.value)}
                  placeholder="Nom de famille"
                  className={errors.nom ? "border-destructive" : ""}
                />
                {errors.nom && <p className="text-xs text-destructive">{errors.nom}</p>}
              </div>
            </div>

            {/* Fonction */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Fonction</Label>
              <Input
                value={form.fonction}
                onChange={(e) => setField("fonction", e.target.value)}
                placeholder="Ex : Directeur commercial, DRH…"
              />
            </div>

            {/* Mail */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={form.mail}
                onChange={(e) => setField("mail", e.target.value)}
                placeholder="contact@societe.fr"
              />
            </div>

            {/* Téléphone portable */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Téléphone portable</Label>
              <Input
                value={form.telephonePortable}
                onChange={(e) => setField("telephonePortable", e.target.value)}
                placeholder="06 xx xx xx xx"
              />
            </div>

            {/* Société (searchable, required for create unless defaultCompanyId set) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Société
                {!defaultCompanyId && <span className="text-xs text-muted-foreground font-normal ml-1">(requis)</span>}
              </Label>
              <CompanyCombobox
                companies={companies}
                value={form.companyId}
                onChange={(v) => setField("companyId", v)}
                hasError={!!errors.companyId}
              />
              {errors.companyId && <p className="text-xs text-destructive">{errors.companyId}</p>}
            </div>

            {/* Lead lié (optional) */}
            {leads.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Lead lié <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <LeadCombobox leads={leads} value={form.leadId} onChange={(v) => setField("leadId", v)} />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Ajouter le contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
