import { api } from "../../lib/api";

export type IncidentSeverity = "info" | "warning" | "critical";
export type IncidentStatus = "open" | "acknowledged" | "resolved";
export type SystemHealthStatus = "online" | "instavel" | "fora_do_ar";

export interface SystemIncident {
  id: string;
  title: string;
  service: string;
  environment: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: string;
  metric_name?: string | null;
  error_count?: number | null;
  threshold_value?: number | null;
  current_value?: number | null;
  description?: string | null;
  tenant_id?: string | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

export interface IncidentFilters {
  status?: IncidentStatus | "";
  severity?: IncidentSeverity | "";
  service?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface IncidentPayload {
  title: string;
  service?: string;
  environment?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  source?: string;
  metric_name?: string | null;
  error_count?: number | null;
  threshold_value?: number | null;
  current_value?: number | null;
  description?: string | null;
  tenant_id?: string | null;
  raw_payload?: Record<string, unknown> | null;
}

export interface PaginatedIncidents {
  data: SystemIncident[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SystemHealthSummary {
  status: SystemHealthStatus;
  open_incidents: number;
  critical_last_24h: number;
  active_critical_incidents: number;
  last_incident_at?: string | null;
  latest_incidents: SystemIncident[];
  metrics?: {
    source: "cloud_monitoring";
    window_minutes: number;
    request_latency_avg_ms: number | null;
    request_latency_p95_ms: number | null;
    database_probe_ms: number | null;
    backend_summary_ms: number | null;
    unavailable_reason?: string | null;
  };
  timestamp: string;
}

const compactFilters = (filters: IncidentFilters = {}) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
);

export const observabilityService = {
  async listSystemIncidents(filters: IncidentFilters = {}) {
    const response = await api.get("/observability/incidents", { params: compactFilters(filters) });
    return response.data?.data as PaginatedIncidents;
  },
  async createSystemIncident(payload: IncidentPayload) {
    const response = await api.post("/observability/incidents", payload);
    return response.data?.data as SystemIncident;
  },
  async acknowledgeSystemIncident(id: string) {
    const response = await api.patch(`/observability/incidents/${id}/acknowledge`);
    return response.data?.data as SystemIncident;
  },
  async resolveSystemIncident(id: string) {
    const response = await api.patch(`/observability/incidents/${id}/resolve`);
    return response.data?.data as SystemIncident;
  },
  async getSystemHealthSummary() {
    const response = await api.get("/observability/health-summary");
    return response.data?.data as SystemHealthSummary;
  },
};
