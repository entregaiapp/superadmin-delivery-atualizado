import { api } from "../../lib/api";

export interface RegraSplitDestinatario {
  id?: string;
  regra_split_id?: string;
  tipo_destinatario: "plataforma" | "loja" | "franquia" | "entregador" | "outro";
  loja_conta_pagamento_id?: string | null;
  provider_account_id?: string | null;
  tipo_valor: "percentual" | "fixo";
  valor: number;
  prioridade: number;
  ativo: boolean;
}

export interface RegraSplit {
  id?: string;
  loja_id: string;
  loja_nome?: string;
  nome: string;
  descricao?: string;
  gateway: string;
  ativo: boolean;
  prioridade: number;
  cobrar_pedidos_app_cliente: boolean;
  cobrar_admin_delivery_entrega: boolean;
  cobrar_admin_delivery_retirada: boolean;
  cobrar_pedidos_salao: boolean;
  cobrar_fiado_com_taxa_registrada: boolean;
  cobrar_fiado_sem_taxa_registrada: boolean;
  criado_em?: string;
  destinatarios?: RegraSplitDestinatario[];
}

export const regrasSplitService = {
  getAll: async () => {
    const response = await api.get("/regras_split");
    return response.data?.data ?? response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/regras_split/${id}`);
    return response.data?.data ?? response.data;
  },

  create: async (payload: RegraSplit) => {
    const response = await api.post("/regras_split", payload);
    return response.data?.data ?? response.data;
  },

  update: async (id: string, payload: Partial<RegraSplit>) => {
    const response = await api.put(`/regras_split/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/regras_split/${id}`);
  },
};
