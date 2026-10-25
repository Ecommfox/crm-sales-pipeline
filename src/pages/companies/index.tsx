import { useMemo, useState } from "react";
import { useList, useDelete } from "@refinedev/core";
import { useNavigate } from "react-router";
import {
  Building2,
  Plus,
  Search,
  X,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Users,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CompanyFormModal } from "@/components/company-form-modal";

import type { Company, Contact, Lead } from "@/types";

// ── Company detail sheet ──────────────────────────────────────────────────────
interface CompanyDetailSheetProps {
  company: Company | null;
  contacts: Contact[];
  leads: Lead[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (company: Company) => void;
}

function CompanyDetailSheet({ company, contacts, leads, open, onOpenChange, onEdit }: CompanyDetailSheetProps) {
  if (!company) return null;

  const companyContacts = contacts.filter((c) => c.companyId === company.id);
  const companyLeads = leads.filter((l) => l.companyId === company.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="text-lg">{company.societe}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{company.activite}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={() => {
                onOpenChange(false);
                onEdit(company);
              }}>
              <Edit className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Company info */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="SIRET" value={company.siret} />
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Activité" value={company.activite} />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Adresse"
                value={`${company.adresse}, ${company.codePostal} ${company.ville}`}
              />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={company.telephone} isPhone />
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Contacts</span>
                <Badge variant="secondary">{companyContacts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {companyContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun contact lié.</p>
              ) : (
                <div className="space-y-2">
                  {companyContacts.map((c) => (
                    <div key={c.id} className="flex items-start justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          {c.civilite} {c.prenom} {c.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.fonction}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600">
                          <a href={`tel:${c.telephonePortable}`}>{c.telephonePortable}</a>
                        </p>
                        <p className="text-xs text-blue-600">
                          <a href={`mailto:${c.mail}`} className="truncate block max-w-[180px]">
                            {c.mail}
                          </a>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Leads associés</span>
                <Badge variant="secondary">{companyLeads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {companyLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun lead lié.</p>
              ) : (
                <div className="space-y-2">
                  {companyLeads.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          {l.civilite} {l.prenom} {l.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">{l.fonction}</p>
                      </div>
                      <StageBadge stage={l.stage} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isPhone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isPhone?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isPhone ? (
          <a href={`tel:${value}`} className="text-sm font-medium text-blue-600 hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

// ── Stage badge (for leads in detail) ────────────────────────────────────────
import type { Stage } from "@/types";

const STAGE_CONFIG: Record<Stage, { label: string; className: string }> = {
  none: { label: "Nouveau", className: "bg-gray-100 text-gray-700 border-gray-200" },
  "pre-qualified": { label: "Pré-qualifié", className: "bg-blue-100 text-blue-700 border-blue-200" },
  qualified: { label: "Qualifié", className: "bg-amber-100 text-amber-700 border-amber-200" },
  "pre-scheduled": { label: "RDV planifié", className: "bg-orange-100 text-orange-700 border-orange-200" },
  confirmed: { label: "RDV confirmé", className: "bg-green-100 text-green-700 border-green-200" },
};

function StageBadge({ stage }: { stage: Stage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <Badge variant="outline" className={`whitespace-nowrap text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const navigate = useNavigate();
  const { result: companiesResult, query: companiesQuery } = useList<Company>({
    resource: "companies",
    pagination: { pageSize: 1000 },
  });

  const { result: contactsResult } = useList<Contact>({
    resource: "contacts",
    pagination: { pageSize: 1000 },
  });

  const { result: leadsResult } = useList<Lead>({
    resource: "leads",
    pagination: { pageSize: 1000 },
  });

  const { mutate: deleteOne } = useDelete();

  const companies: Company[] = companiesResult?.data ?? [];
  const contacts: Contact[] = contactsResult?.data ?? [];
  const leads: Lead[] = leadsResult?.data ?? [];

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activiteFilter, setActiviteFilter] = useState("all");
  const [villeFilter, setVilleFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modal / sheet state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  // Derived filter options
  const activiteOptions = useMemo(
    () => Array.from(new Set(companies.map((c: Company) => c.activite).filter(Boolean))).sort() as string[],
    [companies],
  );
  const villeOptions = useMemo(
    () => Array.from(new Set(companies.map((c: Company) => c.ville).filter(Boolean))).sort() as string[],
    [companies],
  );

  // Filtered companies
  const filtered = useMemo(() => {
    return companies.filter((c: Company) => {
      if (activiteFilter !== "all" && c.activite !== activiteFilter) return false;
      if (villeFilter !== "all" && c.ville !== villeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.societe.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [companies, activiteFilter, villeFilter, searchQuery]);

  // Count helpers
  function countContacts(companyId: string) {
    return contacts.filter((c: Contact) => c.companyId === companyId).length;
  }
  function countLeads(companyId: string) {
    return leads.filter((l: Lead) => l.companyId === companyId).length;
  }

  const hasActiveFilters = searchQuery || activiteFilter !== "all" || villeFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setActiviteFilter("all");
    setVilleFilter("all");
  }

  function handleAddCompany() {
    setEditingCompany(null);
    setFormOpen(true);
  }

  function handleEditCompany(company: Company) {
    setEditingCompany(company);
    setFormOpen(true);
  }

  function handleViewCompany(company: Company) {
    navigate(`/companies/${company.id}`);
  }

  function handleDeleteRequest(company: Company) {
    setDeleteTarget(company);
    setDeleteAlertOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteOne(
      { resource: "companies", id: deleteTarget.id },
      {
        onSuccess: () => {
          companiesQuery.refetch();
          setDeleteAlertOpen(false);
          setDeleteTarget(null);
        },
      },
    );
  }

  function handleFormSuccess() {
    companiesQuery.refetch();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sociétés</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} société{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtrées)"}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleAddCompany}>
          <Plus className="h-4 w-4" />
          Ajouter une société
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-muted/30 shrink-0">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par société…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-64 text-sm pl-8"
          />
        </div>

        <Separator orientation="vertical" className="h-5" />

        <Button
          size="sm"
          variant={showFilters ? "secondary" : "outline"}
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowFilters((v) => !v)}>
          <Filter className="h-3.5 w-3.5" />
          Filtres
          {(activiteFilter !== "all" || villeFilter !== "all") && (
            <Badge variant="secondary" className="h-4 px-1 text-xs font-medium ml-0.5">
              {[activiteFilter !== "all", villeFilter !== "all"].filter(Boolean).length}
            </Badge>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3 opacity-50" /> : <ChevronDown className="h-3 w-3 opacity-50" />}
        </Button>

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 px-6 py-3 border-b bg-muted/10 shrink-0">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Activité</span>
            <Select value={activiteFilter} onValueChange={setActiviteFilter}>
              <SelectTrigger className="h-8 w-52 text-sm">
                <SelectValue placeholder="Toutes les activités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les activités</SelectItem>
                {activiteOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Ville</span>
            <Select value={villeFilter} onValueChange={setVilleFilter}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {villeOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-2 border-b bg-background shrink-0">
          <span className="text-xs text-muted-foreground mr-1">Actifs :</span>
          {searchQuery && (
            <Badge variant="secondary" className="text-xs h-6 gap-1 pr-1 pl-2 font-normal">
              Recherche : "{searchQuery}"
              <button
                onClick={() => setSearchQuery("")}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activiteFilter !== "all" && (
            <Badge variant="secondary" className="text-xs h-6 gap-1 pr-1 pl-2 font-normal">
              Activité : {activiteFilter}
              <button
                onClick={() => setActiviteFilter("all")}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {villeFilter !== "all" && (
            <Badge variant="secondary" className="text-xs h-6 gap-1 pr-1 pl-2 font-normal">
              Ville : {villeFilter}
              <button
                onClick={() => setVilleFilter("all")}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[220px]">
                Société
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[150px]">
                SIRET
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[160px]">
                Activité
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[260px]">
                Adresse
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[130px]">
                Téléphone
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[100px] text-center">
                <span className="flex items-center gap-1 justify-center">
                  <Users className="h-3.5 w-3.5" />
                  Contacts
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[100px] text-center">
                <span className="flex items-center gap-1 justify-center">
                  <Briefcase className="h-3.5 w-3.5" />
                  Leads
                </span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Aucune société trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((company: Company) => {
                const nbContacts = countContacts(company.id);
                const nbLeads = countLeads(company.id);
                return (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleViewCompany(company)}>
                    <TableCell className="py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{company.societe}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle">
                      <span className="font-mono text-xs text-muted-foreground">{company.siret}</span>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle">
                      <Badge variant="outline" className="text-xs font-normal">
                        {company.activite}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle">
                      <span className="text-sm text-muted-foreground">
                        {company.adresse}, {company.codePostal} {company.ville}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle">
                      <a
                        href={`tel:${company.telephone}`}
                        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}>
                        {company.telephone}
                      </a>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle text-center">
                      <Badge
                        variant={nbContacts > 0 ? "secondary" : "outline"}
                        className="text-xs tabular-nums min-w-[28px] justify-center">
                        {nbContacts}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle text-center">
                      <Badge
                        variant={nbLeads > 0 ? "secondary" : "outline"}
                        className="text-xs tabular-nums min-w-[28px] justify-center">
                        {nbLeads}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Voir la fiche"
                          onClick={() => handleViewCompany(company)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Modifier"
                          onClick={() => handleEditCompany(company)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Supprimer"
                          onClick={() => handleDeleteRequest(company)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t bg-muted/20 text-xs text-muted-foreground shrink-0">
        {filtered.length} société{filtered.length !== 1 ? "s" : ""}
        {hasActiveFilters ? ` sur ${companies.length} au total` : ""}
      </div>

      {/* Company form modal (create / edit) */}
      <CompanyFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCompany(null);
        }}
        initialData={editingCompany}
        onSuccess={handleFormSuccess}
      />

      {/* Company detail sheet */}
      <CompanyDetailSheet
        company={selectedCompany}
        contacts={contacts}
        leads={leads}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedCompany(null);
        }}
        onEdit={handleEditCompany}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la société ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer <strong>{deleteTarget?.societe}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
