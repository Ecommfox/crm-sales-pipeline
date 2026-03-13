import { useState, useEffect } from "react";
import { useCreate, useUpdate, useNotification } from "@refinedev/core";
import { Building2, Plus, Trash2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import type { Company } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompanyFormData {
  societe: string;
  siret: string;
  activite: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
}

interface InlineContact {
  _key: string; // local unique key for list rendering
  civilite: string;
  prenom: string;
  nom: string;
  fonction: string;
  mail: string;
  telephonePortable: string;
}

type CompanyFormErrors = Partial<Record<keyof CompanyFormData, string>>;

const EMPTY_FORM: CompanyFormData = {
  societe: "",
  siret: "",
  activite: "",
  adresse: "",
  codePostal: "",
  ville: "",
  telephone: "",
};

const CIVILITE_OPTIONS = ["M.", "Mme", "Dr.", "Me", "Pr."];

function emptyInlineContact(): InlineContact {
  return {
    _key: crypto.randomUUID(),
    civilite: "M.",
    prenom: "",
    nom: "",
    fonction: "",
    mail: "",
    telephonePortable: "",
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, the form is in edit mode pre-filled with this data */
  initialData?: Company | null;
  /** Called after a successful create or update */
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CompanyFormModal({ open, onOpenChange, initialData, onSuccess }: CompanyFormModalProps) {
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
  const { mutate: createContact } = useCreate();

  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<CompanyFormErrors>({});
  const [inlineContacts, setInlineContacts] = useState<InlineContact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const isPending = creating || updating;

  // Populate / reset form when modal opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          societe: initialData.societe ?? "",
          siret: initialData.siret ?? "",
          activite: initialData.activite ?? "",
          adresse: initialData.adresse ?? "",
          codePostal: initialData.codePostal ?? "",
          ville: initialData.ville ?? "",
          telephone: initialData.telephone ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setInlineContacts([]);
      setShowContacts(false);
    }
  }, [open, initialData]);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: CompanyFormErrors = {};
    if (!form.societe.trim()) errs.societe = "La raison sociale est requise.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Inline contacts helpers ────────────────────────────────────────────────

  function addInlineContact() {
    setInlineContacts((prev) => [...prev, emptyInlineContact()]);
    setShowContacts(true);
  }

  function removeInlineContact(key: string) {
    setInlineContacts((prev) => prev.filter((c) => c._key !== key));
  }

  function updateInlineContact(key: string, field: keyof Omit<InlineContact, "_key">, value: string) {
    setInlineContacts((prev) => prev.map((c) => (c._key === key ? { ...c, [field]: value } : c)));
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  function setField(key: keyof CompanyFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!validate()) return;

    const values: Omit<Company, "id"> = {
      societe: form.societe.trim(),
      siret: form.siret.trim(),
      activite: form.activite.trim(),
      adresse: form.adresse.trim(),
      codePostal: form.codePostal.trim(),
      ville: form.ville.trim(),
      telephone: form.telephone.trim(),
    };

    if (isEdit && initialData) {
      update(
        { resource: "companies", id: initialData.id, values },
        {
          onSuccess: () => {
            notify?.({
              type: "success",
              message: "Société mise à jour",
              description: `${values.societe} a été modifiée avec succès.`,
            });
            onSuccess?.();
            onOpenChange(false);
          },
          onError: () => {
            notify?.({ type: "error", message: "Erreur", description: "Impossible de modifier la société." });
          },
        },
      );
    } else {
      create(
        { resource: "companies", values },
        {
          onSuccess: (data) => {
            const newCompanyId = (data.data as Company).id;
            // Create inline contacts
            inlineContacts.forEach((c) => {
              if (c.nom.trim()) {
                createContact({
                  resource: "contacts",
                  values: {
                    civilite: c.civilite,
                    nom: c.nom.trim(),
                    prenom: c.prenom.trim(),
                    fonction: c.fonction.trim(),
                    mail: c.mail.trim(),
                    telephonePortable: c.telephonePortable.trim(),
                    companyId: newCompanyId,
                  },
                });
              }
            });
            notify?.({
              type: "success",
              message: "Société ajoutée",
              description: `${values.societe} a été créée avec succès.`,
            });
            onSuccess?.();
            onOpenChange(false);
          },
          onError: () => {
            notify?.({ type: "error", message: "Erreur", description: "Impossible de créer la société." });
          },
        },
      );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isEdit ? "Modifier la société" : "Ajouter une société"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de la société."
              : "Renseignez les informations de la nouvelle société."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-1">
          <div className="space-y-4 py-1 pr-2">
            {/* ── Société fields ── */}
            <div className="space-y-3">
              {/* Raison sociale */}
              <div className="space-y-1.5">
                <Label htmlFor="societe" className="text-sm font-medium">
                  Raison sociale <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="societe"
                  value={form.societe}
                  onChange={(e) => setField("societe", e.target.value)}
                  placeholder="Ex : Boulangerie Dupont"
                  className={errors.societe ? "border-destructive" : ""}
                />
                {errors.societe && <p className="text-xs text-destructive">{errors.societe}</p>}
              </div>

              {/* SIRET */}
              <div className="space-y-1.5">
                <Label htmlFor="siret" className="text-sm font-medium">
                  SIRET
                </Label>
                <Input
                  id="siret"
                  value={form.siret}
                  onChange={(e) => setField("siret", e.target.value)}
                  placeholder="14 chiffres"
                  className="font-mono"
                />
              </div>

              {/* Activité */}
              <div className="space-y-1.5">
                <Label htmlFor="activite" className="text-sm font-medium">
                  Activité
                </Label>
                <Input
                  id="activite"
                  value={form.activite}
                  onChange={(e) => setField("activite", e.target.value)}
                  placeholder="Ex : Boulangerie"
                />
              </div>

              {/* Adresse */}
              <div className="space-y-1.5">
                <Label htmlFor="adresse" className="text-sm font-medium">
                  Adresse
                </Label>
                <Input
                  id="adresse"
                  value={form.adresse}
                  onChange={(e) => setField("adresse", e.target.value)}
                  placeholder="Ex : 12 Rue de la Paix"
                />
              </div>

              {/* Code postal + Ville */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="codePostal" className="text-sm font-medium">
                    Code postal
                  </Label>
                  <Input
                    id="codePostal"
                    value={form.codePostal}
                    onChange={(e) => setField("codePostal", e.target.value)}
                    placeholder="Ex : 75001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ville" className="text-sm font-medium">
                    Ville
                  </Label>
                  <Input
                    id="ville"
                    value={form.ville}
                    onChange={(e) => setField("ville", e.target.value)}
                    placeholder="Ex : Paris"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <Label htmlFor="telephone" className="text-sm font-medium">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  value={form.telephone}
                  onChange={(e) => setField("telephone", e.target.value)}
                  placeholder="Ex : 0142000001"
                />
              </div>
            </div>

            {/* ── Inline contacts section (only for create) ── */}
            {!isEdit && (
              <>
                <Separator />
                <div className="space-y-3">
                  {/* Section header */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setShowContacts((v) => !v)}>
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      Contacts liés
                      {inlineContacts.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {inlineContacts.length}
                        </Badge>
                      )}
                      {showContacts ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={addInlineContact}>
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter un contact
                    </Button>
                  </div>

                  {/* Contact rows */}
                  {showContacts && inlineContacts.length > 0 && (
                    <div className="space-y-4">
                      {inlineContacts.map((contact, idx) => (
                        <div key={contact._key} className="rounded-lg border bg-muted/20 p-3 space-y-3 relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Contact {idx + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeInlineContact(contact._key)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Civilité + Prénom + Nom */}
                          <div className="grid grid-cols-[80px_1fr_1fr] gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Civilité</Label>
                              <Select
                                value={contact.civilite}
                                onValueChange={(v) => updateInlineContact(contact._key, "civilite", v)}>
                                <SelectTrigger className="h-8 text-sm">
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
                            <div className="space-y-1">
                              <Label className="text-xs">Prénom</Label>
                              <Input
                                value={contact.prenom}
                                onChange={(e) => updateInlineContact(contact._key, "prenom", e.target.value)}
                                placeholder="Prénom"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Nom <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={contact.nom}
                                onChange={(e) => updateInlineContact(contact._key, "nom", e.target.value)}
                                placeholder="Nom"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          {/* Fonction */}
                          <div className="space-y-1">
                            <Label className="text-xs">Fonction</Label>
                            <Input
                              value={contact.fonction}
                              onChange={(e) => updateInlineContact(contact._key, "fonction", e.target.value)}
                              placeholder="Ex : Directeur commercial"
                              className="h-8 text-sm"
                            />
                          </div>

                          {/* Mail + Téléphone */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <Input
                                type="email"
                                value={contact.mail}
                                onChange={(e) => updateInlineContact(contact._key, "mail", e.target.value)}
                                placeholder="email@societe.fr"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tél. portable</Label>
                              <Input
                                value={contact.telephonePortable}
                                onChange={(e) => updateInlineContact(contact._key, "telephonePortable", e.target.value)}
                                placeholder="06 xx xx xx xx"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showContacts && inlineContacts.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Optionnel — ajoutez des contacts directement lors de la création.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer la société"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
