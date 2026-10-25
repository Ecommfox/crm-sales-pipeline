import { useState, useRef } from "react";
import { Upload, FileUp, CheckCircle, AlertCircle, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNotification } from "@refinedev/core";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Lead } from "@/types";

// CSV parsing with type safety
interface ParsedRow {
  [key: string]: string;
}

interface ValidatedLead {
  societe: string;
  siret: string;
  activite: string;
  civilite: string;
  nom: string;
  prenom: string;
  fonction: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephoneFixe: string;
  telephonePortable: string;
  mail: string;
  numeroUnique: string;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

const REQUIRED_FIELDS = [
  "societe",
  "siret",
  "activite",
  "nom",
  "prenom",
  "mail",
  "telephonePortable",
];

const FIELD_MAPPING: Record<string, string[]> = {
  societe: ["société", "company", "nom_entreprise", "raison_sociale"],
  siret: ["siret", "siren", "rcs"],
  activite: ["activité", "activity", "secteur", "industrie"],
  civilite: ["civilité", "civility", "title"],
  nom: ["nom", "last_name", "lastname"],
  prenom: ["prenom", "first_name", "firstname"],
  fonction: ["fonction", "job_title", "position"],
  adresse: ["adresse", "address", "rue", "street"],
  codePostal: ["code_postal", "postal_code", "zip", "zip_code"],
  ville: ["ville", "city"],
  telephoneFixe: ["telephone_fixe", "phone_fixed", "phone", "tel_fixe"],
  telephonePortable: ["telephone_portable", "phone_mobile", "mobile", "tel_mobile", "portable"],
  mail: ["mail", "email", "e-mail"],
  numeroUnique: ["numero_unique", "unique_id", "id"],
};

function normalizeFieldName(header: string): string {
  const cleaned = header.toLowerCase().trim().replace(/[\s_-]/g, "");
  for (const [field, aliases] of Object.entries(FIELD_MAPPING)) {
    if (aliases.some((alias) => alias.replace(/[\s_-]/g, "") === cleaned)) {
      return field;
    }
  }
  return header;
}

function parseCSV(content: string): ParsedRow[] {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => normalizeFieldName(h.trim()));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: ParsedRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function validateLead(row: ParsedRow, rowNumber: number): { lead: ValidatedLead | null; errors: ImportError[] } {
  const errors: ImportError[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!row[field]?.trim()) {
      errors.push({
        row: rowNumber,
        field,
        value: row[field] || "",
        message: `"${field}" est obligatoire`,
      });
    }
  }

  // Validate SIRET format (11 digits)
  if (row.siret && !/^\d{11}$/.test(row.siret.replace(/\s/g, ""))) {
    errors.push({
      row: rowNumber,
      field: "siret",
      value: row.siret,
      message: "Le SIRET doit contenir 11 chiffres",
    });
  }

  // Validate email format
  if (row.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.mail)) {
    errors.push({
      row: rowNumber,
      field: "mail",
      value: row.mail,
      message: "Format d'email invalide",
    });
  }

  if (errors.length > 0) {
    return { lead: null, errors };
  }

  return {
    lead: {
      societe: row.societe?.trim() || "",
      siret: row.siret?.trim() || "",
      activite: row.activite?.trim() || "",
      civilite: row.civilite?.trim() || "M.",
      nom: row.nom?.trim() || "",
      prenom: row.prenom?.trim() || "",
      fonction: row.fonction?.trim() || "",
      adresse: row.adresse?.trim() || "",
      codePostal: row.codePostal?.trim() || "",
      ville: row.ville?.trim() || "",
      telephoneFixe: row.telephoneFixe?.trim() || "",
      telephonePortable: row.telephonePortable?.trim() || "",
      mail: row.mail?.trim() || "",
      numeroUnique: row.numeroUnique?.trim() || `lead-${Date.now()}-${Math.random()}`,
    },
    errors: [],
  };
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { open } = useNotification();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validatedLeads, setValidatedLeads] = useState<ValidatedLead[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      open?.({
        type: "error",
        message: "Format non supporté",
        description: "Seuls les fichiers CSV (.csv) sont supportés",
      });
      return;
    }

    setFile(selectedFile);
    const content = await selectedFile.text();
    const rows = parseCSV(content);
    setParsedData(rows);

    // Validate all rows
    const validated: ValidatedLead[] = [];
    const errors: ImportError[] = [];

    rows.forEach((row, idx) => {
      const { lead, errors: rowErrors } = validateLead(row, idx + 2);
      if (lead) {
        validated.push(lead);
      } else {
        errors.push(...rowErrors);
      }
    });

    setValidatedLeads(validated);
    setValidationErrors(errors);
  }

  async function handleImport() {
    if (validatedLeads.length === 0) {
      open?.({
        type: "error",
        message: "Erreur",
        description: "Aucune ligne valide à importer",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare leads for insertion (map to Supabase schema)
      const leadsToInsert = validatedLeads.map((lead) => ({
        societe: lead.societe,
        siret: lead.siret,
        activite: lead.activite,
        civilite: lead.civilite,
        nom: lead.nom,
        prenom: lead.prenom,
        fonction: lead.fonction,
        adresse: lead.adresse,
        code_postal: lead.codePostal,
        ville: lead.ville,
        telephone_fixe: lead.telephoneFixe,
        telephone_portable: lead.telephonePortable,
        mail: lead.mail,
        numero_unique: lead.numeroUnique,
        stage: "none",
        score: 0,
      }));

      // Batch insert to Supabase
      const { error } = await supabaseClient.from("leads").insert(leadsToInsert);

      if (error) {
        throw error;
      }

      setSuccessCount(validatedLeads.length);
      setImportSuccess(true);

      open?.({
        type: "success",
        message: "Import terminé",
        description: `${validatedLeads.length} leads importés avec succès`,
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setFile(null);
        setParsedData([]);
        setValidatedLeads([]);
        setValidationErrors([]);
        setImportSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 2000);
    } catch (error: any) {
      console.error("Erreur lors de l'import:", error);
      open?.({
        type: "error",
        message: "Erreur lors de l'import",
        description: error.message || "Une erreur est survenue lors de l'import",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function downloadTemplate() {
    const headers = [
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
      "Mail",
      "Numéro Unique",
    ];

    const templateRow = [
      "ACME Inc",
      "12345678901",
      "Technologie",
      "M.",
      "Dupont",
      "Jean",
      "Directeur",
      "123 Rue de Paris",
      "75001",
      "Paris",
      "01 23 45 67 89",
      "06 12 34 56 78",
      "jean@example.com",
      "LEAD-001",
    ];

    const csvContent = [headers.join(","), templateRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Importer des Leads</h1>
        <p className="text-muted-foreground">Importez des leads en masse via un fichier CSV</p>
      </div>

      {/* ─── Upload Section ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Télécharger un fichier CSV
          </CardTitle>
          <CardDescription>
            Sélectionnez un fichier CSV contenant vos leads. Les colonnes seront détectées automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">Cliquez pour sélectionner un fichier</p>
            <p className="text-sm text-muted-foreground">ou glissez-déposez votre CSV</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setValidatedLeads([]);
                  setValidationErrors([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Télécharger le modèle
          </Button>
        </CardContent>
      </Card>

      {/* ─── Stats ─── */}
      {(validatedLeads.length > 0 || validationErrors.length > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lignes valides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{validatedLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Erreurs détectées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{validationErrors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parsedData.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Validation Errors ─── */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">{validationErrors.length} erreur(s) détectée(s)</div>
            <div className="max-h-40 overflow-y-auto text-sm space-y-1">
              {validationErrors.slice(0, 10).map((error, idx) => (
                <div key={idx} className="text-xs">
                  Ligne {error.row}: {error.field} - {error.message}
                </div>
              ))}
              {validationErrors.length > 10 && (
                <div className="text-xs text-muted-foreground">
                  ... et {validationErrors.length - 10} autre(s) erreur(s)
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Success Message ─── */}
      {importSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="font-medium">{successCount} leads importés avec succès!</div>
            <div className="text-sm">Les données sont maintenant synchronisées dans Supabase</div>
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Preview ─── */}
      {validatedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Aperçu des leads valides
            </CardTitle>
            <CardDescription>Affiche les {Math.min(validatedLeads.length, 10)} premiers leads</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Société</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validatedLeads.slice(0, 10).map((lead, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{lead.societe}</TableCell>
                      <TableCell>{lead.nom}</TableCell>
                      <TableCell>{lead.prenom}</TableCell>
                      <TableCell>{lead.mail}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.telephonePortable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {validatedLeads.length > 10 && (
              <div className="text-sm text-muted-foreground mt-4">
                ... et {validatedLeads.length - 10} autres leads
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Actions ─── */}
      {validatedLeads.length > 0 && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setParsedData([]);
              setValidatedLeads([]);
              setValidationErrors([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || validatedLeads.length === 0}
            className="gap-2"
          >
            {isLoading ? "Importation en cours..." : `Importer ${validatedLeads.length} leads`}
          </Button>
        </div>
      )}
    </div>
  );
}
