import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import type {
  DataProvider,
  GetListParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteOneParams,
  GetManyParams,
} from "@refinedev/core";
import { supabaseClient } from "@/lib/supabaseClient";
import mockData from "@/mocks.json";

// ── Field mappings: TypeScript camelCase → Supabase snake_case ────────────────
// Format: { tsField: supabaseColumn }

const LEADS_MAP: Record<string, string> = {
  companyId: "company_id",
  codePostal: "code_postal",
  telephoneFixe: "telephone_fixe",
  telephonePortable: "telephone_portable",
  mail: "email",
  dateHeureAppel: "date_appel",
  etatAppel: "etat_appel",
  commentaireTeleoperateur: "commentaire",
  teleoperateurAppel: "teleoperateur",
  numeroUnique: "numero_unique",
  interestLevel: "interest_level",
  painPoints: "pain_points",
  identifiedNeeds: "identified_needs",
  openForAppointment: "open_for_appointment",
  mainContactId: "main_contact_id",
  archived: "archived",
  createdAt: "created_at",
};

const LEADS_MAP_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(LEADS_MAP).map(([k, v]) => [v, k]));

const COMPANIES_MAP: Record<string, string> = {
  societe: "nom",
  codePostal: "code_postal",
  createdAt: "created_at",
};

const COMPANIES_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPANIES_MAP).map(([k, v]) => [v, k]),
);

const CONTACTS_MAP: Record<string, string> = {
  mail: "email",
  telephonePortable: "telephone_portable",
  companyId: "company_id",
  createdAt: "created_at",
};

const CONTACTS_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(CONTACTS_MAP).map(([k, v]) => [v, k]),
);

const CALL_LOGS_MAP: Record<string, string> = {
  leadId: "lead_id",
  callResult: "resultat",
  callType: "type_appel",
  leadStatusAfter: "statut_lead",
  comment: "commentaire",
  teleoperator: "teleoperateur",
  date: "created_at",
  createdAt: "created_at",
};

const CALL_LOGS_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(CALL_LOGS_MAP).map(([k, v]) => [v, k]),
);
// Override: created_at → date (not createdAt) for call logs
CALL_LOGS_MAP_REVERSE["created_at"] = "date";

const APPOINTMENTS_MAP: Record<string, string> = {
  leadId: "lead_id",
  contactId: "contact_id",
  companyId: "company_id",
  appointmentDate: "scheduled_date",
  appointmentTime: "appointment_time",
  appointmentType: "appointment_type",
  finalStatus: "final_status",
  emailSent: "email_sent",
  notes: "notes",
  callRecordingUrl: "call_recording_url",
  confirmed: "confirmed",
  createdAt: "created_at",
};

const APPOINTMENTS_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(APPOINTMENTS_MAP).map(([k, v]) => [v, k]),
);

// Resource name aliases (TS/UI name → Supabase table name)
const RESOURCE_NAME_MAP: Record<string, string> = {
  callLogs: "call_logs",
  call_logs: "call_logs",
  leads: "leads",
  companies: "companies",
  contacts: "contacts",
  appointments: "appointments",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFieldMap(resource: string): Record<string, string> {
  const table = RESOURCE_NAME_MAP[resource] ?? resource;
  switch (table) {
    case "leads":
      return LEADS_MAP;
    case "companies":
      return COMPANIES_MAP;
    case "contacts":
      return CONTACTS_MAP;
    case "call_logs":
      return CALL_LOGS_MAP;
    case "appointments":
      return APPOINTMENTS_MAP;
    default:
      return {};
  }
}

function getReverseMap(resource: string): Record<string, string> {
  const table = RESOURCE_NAME_MAP[resource] ?? resource;
  switch (table) {
    case "leads":
      return LEADS_MAP_REVERSE;
    case "companies":
      return COMPANIES_MAP_REVERSE;
    case "contacts":
      return CONTACTS_MAP_REVERSE;
    case "call_logs":
      return CALL_LOGS_MAP_REVERSE;
    case "appointments":
      return APPOINTMENTS_MAP_REVERSE;
    default:
      return {};
  }
}

/** Convert a TS camelCase field to Supabase column name */
function toSupabase(resource: string, field: string): string {
  const map = getFieldMap(resource);
  return map[field] ?? field;
}

/** Convert a Supabase row object to TS-named object */
function fromSupabaseRow(resource: string, row: Record<string, unknown>): Record<string, unknown> {
  if (!row) return row;
  const reverseMap = getReverseMap(resource);
  const result: Record<string, unknown> = {};
  for (const [col, val] of Object.entries(row)) {
    const tsKey = reverseMap[col] ?? col;
    result[tsKey] = val;
  }

  // For leads, extract company name from joined companies object
  const table = RESOURCE_NAME_MAP[resource] ?? resource;
  if (table === "leads" && result.companies && typeof result.companies === "object") {
    const company = result.companies as Record<string, unknown>;
    if (!result.societe) {
      result.societe = company.nom ?? null;
    }
    delete result.companies;
  }

  return result;
}

/** Convert a TS-named object to Supabase column-named object */
function toSupabaseRow(resource: string, data: Record<string, unknown>): Record<string, unknown> {
  if (!data) return data;
  const map = getFieldMap(resource);
  const table = RESOURCE_NAME_MAP[resource] ?? resource;
  const result: Record<string, unknown> = {};
  for (const [field, val] of Object.entries(data)) {
    // Skip computed/joined fields that are not real columns
    if (table === "leads" && field === "societe") continue;
    const col = map[field] ?? field;
    result[col] = val;
  }
  return result;
}

/** Map filters field names from TS to Supabase */
function mapFilters(resource: string, filters: GetListParams["filters"]): GetListParams["filters"] {
  if (!filters) return filters;
  return filters.map((filter) => {
    if ("field" in filter) {
      return { ...filter, field: toSupabase(resource, filter.field) };
    }
    return filter;
  });
}

/** Map sorters field names from TS to Supabase */
function mapSorters(resource: string, sorters: GetListParams["sorters"]): GetListParams["sorters"] {
  if (!sorters) return sorters;
  return sorters.map((s) => ({ ...s, field: toSupabase(resource, s.field) }));
}

// ── Underlying Supabase data provider ────────────────────────────────────────

const baseProvider = supabaseDataProvider(supabaseClient) as DataProvider;

// ── Wrapped data provider ─────────────────────────────────────────────────────

export const dataProvider: DataProvider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getList: async (params: GetListParams): Promise<any> => {
    try {
      const supabaseResource = RESOURCE_NAME_MAP[params.resource] ?? params.resource;

      // Auto-join company name for leads
      let meta = params.meta;
      if (supabaseResource === "leads" && !params.meta?.select) {
        meta = { ...meta, select: "*, companies(nom)" };
      }

      const result = await baseProvider.getList({
        ...params,
        meta,
        resource: supabaseResource,
        filters: mapFilters(params.resource, params.filters),
        sorters: mapSorters(params.resource, params.sorters),
      });
      return {
        ...result,
        data: result.data.map((row) => fromSupabaseRow(params.resource, row as Record<string, unknown>)),
      };
    } catch (error) {
      // Fallback to mock data if Supabase is unavailable
      console.warn(`Supabase query failed for resource "${params.resource}". Using mock data.`, error);
      
      const mockTable = mockData[params.resource as keyof typeof mockData] ?? [];
      const items = Array.isArray(mockTable) ? mockTable : [];
      
      return {
        data: items,
        total: items.length,
        pageSize: items.length,
        hasPagination: false,
      };
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOne: async (params: GetOneParams): Promise<any> => {
    try {
      const supabaseResource = RESOURCE_NAME_MAP[params.resource] ?? params.resource;

      // Auto-join company name for leads
      let meta = params.meta;
      if (supabaseResource === "leads" && !params.meta?.select) {
        meta = { ...meta, select: "*, companies(nom)" };
      }

      const result = await baseProvider.getOne({ ...params, meta, resource: supabaseResource });
      return {
        ...result,
        data: fromSupabaseRow(params.resource, result.data as Record<string, unknown>),
      };
    } catch (error) {
      // Fallback to mock data if Supabase is unavailable
      console.warn(`Supabase query failed for resource "${params.resource}". Using mock data.`, error);
      
      const mockTable = mockData[params.resource as keyof typeof mockData] ?? [];
      const items = Array.isArray(mockTable) ? mockTable : [];
      const item = items.find((i: any) => i.id == params.id);
      
      if (!item) {
        throw new Error(`Mock data: Item with id ${params.id} not found in resource ${params.resource}`);
      }
      
      return { data: item };
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: async (params: CreateParams<any>): Promise<any> => {
    const supabaseResource = RESOURCE_NAME_MAP[params.resource] ?? params.resource;
    const result = await baseProvider.create({
      ...params,
      resource: supabaseResource,
      variables: toSupabaseRow(params.resource, params.variables as Record<string, unknown>),
    });
    return {
      ...result,
      data: fromSupabaseRow(params.resource, result.data as Record<string, unknown>),
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: async (params: UpdateParams<any>): Promise<any> => {
    const supabaseResource = RESOURCE_NAME_MAP[params.resource] ?? params.resource;
    const result = await baseProvider.update({
      ...params,
      resource: supabaseResource,
      variables: toSupabaseRow(params.resource, params.variables as Record<string, unknown>),
    });
    return {
      ...result,
      data: fromSupabaseRow(params.resource, result.data as Record<string, unknown>),
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteOne: async (params: DeleteOneParams<any>): Promise<any> => {
    const supabaseResource = RESOURCE_NAME_MAP[params.resource] ?? params.resource;
    const result = await baseProvider.deleteOne({ ...params, resource: supabaseResource });
    return result;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMany: async (params: GetManyParams): Promise<any> => {
    const supabaseResource = RESOURCE_NAME_MAP[params.resource] ?? params.resource;
    const result = await baseProvider.getMany!({ ...params, resource: supabaseResource });
    return {
      ...result,
      data: result.data.map((row) => fromSupabaseRow(params.resource, row as Record<string, unknown>)),
    };
  },

  getApiUrl: () => baseProvider.getApiUrl(),

  custom: baseProvider.custom,
};
