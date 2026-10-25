import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { PhoneCall, SlidersHorizontal, ChevronDown, X, Filter, ChevronUp, ListFilter, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { LogCallModal } from "@/components/log-call-modal";
import { useRealtime } from "@/hooks/use-realtime";
import type { Lead, Stage, CallResult } from "@/types";

// ── Stage badge config ────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<Stage, { label: string; className: string }> = {
  none: {
    label: "Nouveau",
    className:
      "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
  "pre-qualified": {
    label: "Pré-qualifié",
    className:
      "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  qualified: {
    label: "Qualifié",
    className:
      "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  },
  "pre-scheduled": {
    label: "RDV planifié",
    className:
      "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  },
  confirmed: {
    label: "RDV confirmé",
    className:
      "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
  },
};

function StageBadge({ stage }: { stage: Stage }) {
  const config = STAGE_CONFIG[stage];
  return (
    <Badge variant="outline" className={`whitespace-nowrap text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// ── Call result badge ─────────────────────────────────────────────────────────
const CALL_RESULT_COLORS: Record<CallResult, string> = {
  Ignoré: "bg-gray-100 text-gray-600 border-gray-200",
  Répondeur: "bg-sky-100 text-sky-700 border-sky-200",
  "Barrage secrétaire": "bg-purple-100 text-purple-700 border-purple-200",
  "Non décroché": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Non appelé": "bg-slate-100 text-slate-600 border-slate-200",
  "Numéro non attribué": "bg-red-100 text-red-600 border-red-200",
  "Liste noire": "bg-red-900/20 text-red-800 border-red-300",
  Positif: "bg-green-100 text-green-700 border-green-200",
  Negatif: "bg-red-100 text-red-700 border-red-200",
};

function CallResultBadge({ result }: { result: CallResult | null }) {
  if (!result) return <span className="text-muted-foreground text-xs">—</span>;
  const cls = CALL_RESULT_COLORS[result] ?? "bg-gray-100 text-gray-600";
  return (
    <Badge variant="outline" className={`whitespace-nowrap text-xs ${cls}`}>
      {result}
    </Badge>
  );
}

// ── Format datetime ───────────────────────────────────────────────────────────
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
// ── CSV Export function ───────────────────────────────────────────────────────
function exportToCSV(leads: Lead[], filename: string = "leads.csv") {
  const headers = [
    "ID",
    "Statut",
    "Société",
    "SIRET",
    "Activité",
    "Civilité",
    "Nom",
    "Prénom",
    "Fonction",
    "Adresse",
    "Code Postal",
    "Ville",
    "Téléphone Fixe",
    "Téléphone Portable",
    "Email",
    "Date/Heure Appel",
    "État Appel",
    "Commentaire",
    "Numéro Unique",
    "Téléopérateur",
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.stage,
    lead.societe,
    lead.siret,
    lead.activite,
    lead.civilite,
    lead.nom,
    lead.prenom,
    lead.fonction,
    lead.adresse,
    lead.codePostal,
    lead.ville,
    lead.telephoneFixe,
    lead.telephonePortable,
    lead.mail,
    formatDate(lead.dateHeureAppel),
    lead.etatAppel || "",
    lead.commentaireTeleoperateur || "",
    lead.numeroUnique,
    lead.teleoperateurAppel || "",
  ]);

  // Escape CSV values
  const escapedRows = rows.map((row) =>
    row.map((cell) => {
      const str = String(cell || "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
  );

  const csv = [headers.join(","), ...escapedRows.map((row) => row.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
// ── Column meta label map ─────────────────────────────────────────────────────
const COLUMN_LABELS: Record<string, string> = {
  stage: "Statut",
  societe: "Société",
  siret: "Siret",
  activite: "Activité",
  civilite: "Civilité",
  nom: "Nom",
  prenom: "Prénom",
  fonction: "Fonction",
  adresse: "Adresse",
  codePostal: "Code Postal",
  ville: "Ville",
  telephoneFixe: "Téléphone fixe",
  telephonePortable: "Téléphone portable",
  mail: "Mail",
  dateHeureAppel: "Date/heure appel",
  etatAppel: "État appel",
  commentaireTeleoperateur: "Commentaire",
  numeroUnique: "Numéro unique",
  teleoperateurAppel: "Téléopérateur",
  actions: "Actions",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LeadsListPage() {
  const navigate = useNavigate();

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    siret: false,
    adresse: false,
    commentaireTeleoperateur: false,
  });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [etatFilter, setEtatFilter] = useState<string>("all");
  const [villeFilter, setVilleFilter] = useState<string>("all");
  const [activiteFilter, setActiviteFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uncontactedOnly, setUncontactedOnly] = useState(false);

  // Log-call modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [logCallOpen, setLogCallOpen] = useState(false);

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "stage",
        accessorKey: "stage",
        header: "Statut",
        size: 130,
        cell: ({ row }) => <StageBadge stage={row.original.stage} />,
      },
      {
        id: "societe",
        accessorKey: "societe",
        header: "Société",
        size: 180,
        cell: ({ row }) => <span className="font-medium text-sm">{row.original.societe}</span>,
      },
      {
        id: "siret",
        accessorKey: "siret",
        header: "Siret",
        size: 150,
      },
      {
        id: "activite",
        accessorKey: "activite",
        header: "Activité",
        size: 160,
      },
      {
        id: "civilite",
        accessorKey: "civilite",
        header: "Civilité",
        size: 80,
      },
      {
        id: "nom",
        accessorKey: "nom",
        header: "Nom",
        size: 110,
        cell: ({ row }) => <span className="font-medium">{row.original.nom}</span>,
      },
      {
        id: "prenom",
        accessorKey: "prenom",
        header: "Prénom",
        size: 110,
      },
      {
        id: "fonction",
        accessorKey: "fonction",
        header: "Fonction",
        size: 170,
      },
      {
        id: "adresse",
        accessorKey: "adresse",
        header: "Adresse",
        size: 200,
      },
      {
        id: "codePostal",
        accessorKey: "codePostal",
        header: "Code Postal",
        size: 100,
      },
      {
        id: "ville",
        accessorKey: "ville",
        header: "Ville",
        size: 120,
      },
      {
        id: "telephoneFixe",
        accessorKey: "telephoneFixe",
        header: "Téléphone fixe",
        size: 140,
        cell: ({ row }) => (
          <a
            href={`tel:${row.original.telephoneFixe}`}
            className="text-blue-600 hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}>
            {row.original.telephoneFixe}
          </a>
        ),
      },
      {
        id: "telephonePortable",
        accessorKey: "telephonePortable",
        header: "Téléphone portable",
        size: 150,
        cell: ({ row }) => (
          <a
            href={`tel:${row.original.telephonePortable}`}
            className="text-blue-600 hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}>
            {row.original.telephonePortable}
          </a>
        ),
      },
      {
        id: "mail",
        accessorKey: "mail",
        header: "Mail",
        size: 220,
        cell: ({ row }) => (
          <a
            href={`mailto:${row.original.mail}`}
            className="text-blue-600 hover:underline text-sm truncate block max-w-[200px]"
            onClick={(e) => e.stopPropagation()}>
            {row.original.mail}
          </a>
        ),
      },
      {
        id: "dateHeureAppel",
        accessorKey: "dateHeureAppel",
        header: "Date/heure appel",
        size: 150,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.dateHeureAppel)}</span>
        ),
      },
      {
        id: "etatAppel",
        accessorKey: "etatAppel",
        header: "État appel",
        size: 160,
        cell: ({ row }) => <CallResultBadge result={row.original.etatAppel} />,
      },
      {
        id: "commentaireTeleoperateur",
        accessorKey: "commentaireTeleoperateur",
        header: "Commentaire",
        size: 220,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
            {row.original.commentaireTeleoperateur ?? "—"}
          </span>
        ),
      },
      {
        id: "numeroUnique",
        accessorKey: "numeroUnique",
        header: "Numéro unique",
        size: 120,
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.numeroUnique}</span>,
      },
      {
        id: "teleoperateurAppel",
        accessorKey: "teleoperateurAppel",
        header: "Téléopérateur",
        size: 150,
        cell: ({ row }) => <span className="text-sm">{row.original.teleoperateurAppel ?? "—"}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        size: 140,
        enableHiding: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className="whitespace-nowrap gap-1.5 text-xs h-7 px-2"
              onClick={() => {
                setSelectedLead(row.original);
                setLogCallOpen(true);
              }}>
              <PhoneCall className="h-3.5 w-3.5" />
              Journal d'appel
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useTable<Lead>({
    columns,
    refineCoreProps: {
      resource: "leads",
      pagination: { pageSize: 50 },
    },
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const { getHeaderGroups, getRowModel, getAllColumns } = table.reactTable;
  const tableQuery = (table as any)?.query;

  const rawRows = getRowModel().rows;

  // Set up real-time subscriptions for auto-refresh
  // Call at top level (not inside useEffect) per React's Rules of Hooks
  useRealtime({
    table: "leads",
    onInsert: () => {
      console.log("[Leads] New lead inserted - refetching...");
      tableQuery?.refetch?.();
    },
    onUpdate: () => {
      console.log("[Leads] Lead updated - refetching...");
      tableQuery?.refetch?.();
    },
  });

  // Derive unique Ville and Activité options from raw data
  const villeOptions = useMemo(() => {
    const vals = Array.from(new Set(rawRows.map((r) => r.original.ville).filter(Boolean))).sort();
    return vals as string[];
  }, [rawRows]);

  const activiteOptions = useMemo(() => {
    const vals = Array.from(new Set(rawRows.map((r) => r.original.activite).filter(Boolean))).sort();
    return vals as string[];
  }, [rawRows]);

  // Client-side filtering
  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      const lead = row.original;

      // Filter out archived leads by default
      if (lead.archived) return false;

      if (stageFilter !== "all" && lead.stage !== stageFilter) return false;
      if (etatFilter !== "all" && lead.etatAppel !== etatFilter) return false;
      if (villeFilter !== "all" && lead.ville !== villeFilter) return false;
      if (activiteFilter !== "all" && lead.activite !== activiteFilter) return false;
      // "Non contactés" = never had a call (dateHeureAppel is null)
      if (uncontactedOnly && lead.dateHeureAppel !== null) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          lead.societe,
          lead.nom,
          lead.prenom,
          lead.ville,
          lead.activite,
          lead.mail,
          lead.teleoperateurAppel,
          lead.numeroUnique,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rawRows, stageFilter, etatFilter, villeFilter, activiteFilter, uncontactedOnly, searchQuery]);

  const hiddenColumnsCount = getAllColumns().filter((col) => col.getCanHide() && !col.getIsVisible()).length;

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (uncontactedOnly)
      chips.push({
        key: "uncontacted",
        label: "Non contactés",
        clear: () => setUncontactedOnly(false),
      });
    if (stageFilter !== "all")
      chips.push({
        key: "stage",
        label: `Statut : ${STAGE_CONFIG[stageFilter as Stage]?.label ?? stageFilter}`,
        clear: () => setStageFilter("all"),
      });
    if (etatFilter !== "all")
      chips.push({
        key: "etat",
        label: `État : ${etatFilter}`,
        clear: () => setEtatFilter("all"),
      });
    if (villeFilter !== "all")
      chips.push({
        key: "ville",
        label: `Ville : ${villeFilter}`,
        clear: () => setVilleFilter("all"),
      });
    if (activiteFilter !== "all")
      chips.push({
        key: "activite",
        label: `Activité : ${activiteFilter}`,
        clear: () => setActiviteFilter("all"),
      });
    if (searchQuery)
      chips.push({
        key: "search",
        label: `Recherche : "${searchQuery}"`,
        clear: () => setSearchQuery(""),
      });
    return chips;
  }, [uncontactedOnly, stageFilter, etatFilter, villeFilter, activiteFilter, searchQuery]);

  const hasActiveFilters = activeChips.length > 0;

  function clearAllFilters() {
    setStageFilter("all");
    setEtatFilter("all");
    setVilleFilter("all");
    setActiviteFilter("all");
    setUncontactedOnly(false);
    setSearchQuery("");
  }

  // Called after successful call log — refetch table data
  function handleCallLogged() {
    table.refineCore.tableQuery.refetch();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredRows.length} lead{filteredRows.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtrés)"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download CSV button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const timestamp = new Date().toISOString().split("T")[0];
              exportToCSV(filteredRows.map((r) => r.original), `leads_${timestamp}.csv`);
            }}>
            <Download className="h-4 w-4" />
            Télécharger
          </Button>

          {/* Column visibility toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Colonnes
                {hiddenColumnsCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs font-medium">
                    {hiddenColumnsCount}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-96 overflow-y-auto">
              <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(val) => col.toggleVisibility(val)}>
                    {COLUMN_LABELS[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-muted/30 shrink-0">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        {/* Search */}
        <Input
          placeholder="Rechercher (société, nom, ville…)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-64 text-sm"
        />

        {/* Non contactés quick filter */}
        <Button
          size="sm"
          variant={uncontactedOnly ? "default" : "outline"}
          className="h-8 text-xs gap-1.5"
          onClick={() => setUncontactedOnly((v) => !v)}>
          <PhoneCall className="h-3.5 w-3.5" />
          Non contactés
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Filter panel toggle */}
        <Button
          size="sm"
          variant={showFilters ? "secondary" : "outline"}
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowFilters((v) => !v)}>
          <ListFilter className="h-3.5 w-3.5" />
          Filtres
          {activeChips.filter((c) => c.key !== "uncontacted" && c.key !== "search").length > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-xs font-medium ml-0.5">
              {activeChips.filter((c) => c.key !== "uncontacted" && c.key !== "search").length}
            </Badge>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3 opacity-50" /> : <ChevronDown className="h-3 w-3 opacity-50" />}
        </Button>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1 text-muted-foreground"
            onClick={clearAllFilters}>
            <X className="h-3.5 w-3.5" />
            Tout effacer
          </Button>
        )}
      </div>

      {/* Collapsible advanced filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 px-6 py-3 border-b bg-muted/10 shrink-0">
          {/* Stage filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Statut</span>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {(Object.entries(STAGE_CONFIG) as [Stage, { label: string; className: string }][]).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* État appel filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">État appel</span>
            <Select value={etatFilter} onValueChange={setEtatFilter}>
              <SelectTrigger className="h-8 w-52 text-sm">
                <SelectValue placeholder="Tous les états" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                {(
                  [
                    "Ignoré",
                    "Répondeur",
                    "Barrage secrétaire",
                    "Non décroché",
                    "Non appelé",
                    "Numéro non attribué",
                    "Liste noire",
                  ] as CallResult[]
                ).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ville filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Ville</span>
            <Select value={villeFilter} onValueChange={setVilleFilter}>
              <SelectTrigger className="h-8 w-40 text-sm">
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

          {/* Activité filter */}
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
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-2 border-b bg-background shrink-0">
          <span className="text-xs text-muted-foreground mr-1">Actifs :</span>
          {activeChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="text-xs h-6 gap-1 pr-1 pl-2 font-normal">
              {chip.label}
              <button
                onClick={chip.clear}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                aria-label={`Supprimer le filtre ${chip.label}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2 text-muted-foreground"
            onClick={clearAllFilters}>
            Tout effacer
          </Button>
        </div>
      )}

      {/* Table wrapper — sticky header + horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <Table style={{ minWidth: "2400px" }}>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            {getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-background border-b">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={getAllColumns().filter((c) => c.getIsVisible()).length}
                  className="h-32 text-center text-muted-foreground">
                  Aucun lead trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/leads/${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="py-2.5 text-sm align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer count */}
      <div className="px-6 py-2 border-t bg-muted/20 text-xs text-muted-foreground shrink-0">
        Affichage de {filteredRows.length} lead
        {filteredRows.length !== 1 ? "s" : ""}
        {hasActiveFilters ? ` sur ${rawRows.length} au total` : ""}
      </div>

      {/* Log Call Modal */}
      <LogCallModal
        lead={selectedLead}
        open={logCallOpen}
        onOpenChange={(open) => {
          setLogCallOpen(open);
          if (!open) setSelectedLead(null);
        }}
        onSuccess={handleCallLogged}
      />
    </div>
  );
}
