import { api } from "../../lib/api";

export type LegalDocumentStatus = "draft" | "published" | "archived";

export interface LegalDocument {
  id: string;
  document_key: string;
  title: string;
  version: string;
  content_markdown: string;
  status: LegalDocumentStatus;
  published_at?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface LegalDocumentAdminResponse {
  document_key: string;
  latest: LegalDocument | null;
  published: LegalDocument | null;
  versions: LegalDocument[];
}

export interface SaveLegalDocumentPayload {
  title: string;
  version: string;
  content_markdown: string;
  status: LegalDocumentStatus;
}

export const legalDocumentService = {
  async get(documentKey = "privacy-policy") {
    const response = await api.get(`/legal-documents/${documentKey}`);
    return response.data?.data as LegalDocumentAdminResponse;
  },

  async save(documentKey: string, payload: SaveLegalDocumentPayload) {
    const response = await api.put(`/legal-documents/${documentKey}`, payload);
    return response.data?.data as LegalDocument;
  },
};
