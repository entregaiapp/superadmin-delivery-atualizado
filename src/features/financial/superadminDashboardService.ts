import { api } from "../../lib/api";

export type FinancialReference = "payment" | "order";
export type OrderSource = "CUSTOMER_APP" | "ADMIN" | "SALON" | "UNKNOWN";
export type CaptureChannel = "ONLINE_GATEWAY" | "EXTERNAL_OR_OFFLINE" | "CREDIT_TAB";
export type PaymentMethod = "PIX" | "CARD" | "CASH" | "CREDIT_TAB";
export type FinancialStatus = "RECEIVED" | "PENDING" | "REFUNDED" | "CANCELED" | "REJECTED" | "EXPIRED" | "UNDEFINED";

export type DashboardFilters = {
  dataInicio: string;
  dataFim: string;
  lojaId?: string;
  dateType?: FinancialReference;
  orderSource?: OrderSource | "";
  captureChannel?: CaptureChannel | "";
  paymentMethod?: PaymentMethod | "";
  financialStatus?: FinancialStatus | "";
};

export type MoneyBucket = {
  valor_registrado: number;
  valor_recebido: number;
  valor_pendente: number;
  valor_liquido_recebido: number;
  taxas_gateway: number;
  valor_estornado: number;
  valor_cancelado: number;
  valor_rejeitado: number;
  valor_expirado: number;
  valor_fiado: number;
};

export type LabeledMoneyBucket = MoneyBucket & {
  key: string;
  label: string;
};

export type ChannelMatrixRow = MoneyBucket & {
  order_source: OrderSource;
  payment_capture_channel: CaptureChannel;
  payment_method: PaymentMethod;
};

export type PlatformRule = {
  id: string;
  nome?: string | null;
  gateway?: string | null;
  tipo_valor: "percentual" | "fixo";
  valor: number;
  atualizado_em?: string | null;
};

export type PlatformMoney = {
  base_elegivel: number;
  taxa_calculada: number;
  taxa_estornada: number;
  taxa_liquida: number;
  split_recebido: number;
  split_pendente: number;
  valor_a_cobrar: number;
  diferenca_conciliacao: number;
};

export type StoreFinancialRow = MoneyBucket & PlatformMoney & {
  loja_id: string;
  loja_nome: string;
  regra_split: PlatformRule | null;
  app_recebido: number;
  admin_recebido: number;
  salao_recebido: number;
  online_recebido: number;
  offline_recebido: number;
};

export type OrderOriginPercentagePoint = {
  data: string;
  quantidade_app: number;
  quantidade_admin: number;
  total_pedidos: number;
  percentual_app: number;
  percentual_admin: number;
};

export type FinancialDashboard = {
  periodo: {
    data_inicio: string | null;
    data_fim: string | null;
    referencia: FinancialReference;
    time_zone: string;
  };
  filtros: Record<string, string | string[] | null>;
  resumo: MoneyBucket & {
    fiado_recebido: number;
    total_efetivamente_recebido: number;
  };
  por_origem: LabeledMoneyBucket[];
  por_canal_captura: LabeledMoneyBucket[];
  por_situacao: LabeledMoneyBucket[];
  matriz_canais: ChannelMatrixRow[];
  evolucao_diaria: Array<{
    data: string;
    app: number;
    admin: number;
    salao: number;
    desconhecido: number;
    online: number;
    offline: number;
    fiado: number;
  }>;
  evolucao_percentual_pedidos: OrderOriginPercentagePoint[];
  taxa_plataforma: {
    resumo: PlatformMoney;
    por_loja: StoreFinancialRow[];
  };
  fiado: {
    valor_lancado: number;
    saldo_pendente: number;
    valor_recebido: number;
    valor_sem_origem: number;
    recebimentos_por_metodo: Array<{ payment_method: PaymentMethod; valor_recebido: number }>;
  };
  alertas: {
    origem_desconhecida: number;
    canal_indefinido: number;
    metodo_indefinido: number;
    fiado_sem_origem: number;
    lojas_sem_regra: Array<{ loja_id: string; loja_nome: string; valor_registrado: number }>;
    diferenca_conciliacao: number;
  };
  gerado_em: string;
};

export const superadminDashboardService = {
  async get(filters: DashboardFilters) {
    const { data } = await api.get<{ success: boolean; data: FinancialDashboard }>("/financeiro/superadmin/dashboard", {
      params: {
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
        loja_id: filters.lojaId || undefined,
        dateType: filters.dateType || "payment",
        order_source: filters.orderSource || undefined,
        payment_capture_channel: filters.captureChannel || undefined,
        payment_method: filters.paymentMethod || undefined,
        financial_status: filters.financialStatus || undefined,
      },
    });
    return data.data;
  },
};
