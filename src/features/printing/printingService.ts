import { api } from "../../lib/api";

export type PrintingOperationalRow = {
  loja_id: string;
  loja_nome: string;
  agent_id?: string | null;
  agent_name?: string | null;
  app_version?: string | null;
  last_seen_at?: string | null;
  revoked_at?: string | null;
  printers: number;
  pending_jobs: number;
  failed_jobs: number;
  online: boolean;
};

export const printingService = {
  async operationalSummary() {
    const response = await api.get("/printing/operational-summary");
    return (response.data?.data ?? []) as PrintingOperationalRow[];
  },

  async listJobs(status?: string) {
    const response = await api.get("/printing/jobs", { params: { status, per_page: 50 } });
    return response.data?.data;
  },
};
