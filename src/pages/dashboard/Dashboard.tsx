import { useMemo, useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  Clock,
  CreditCard,
  DollarSign,
  Info,
  Loader2,
  Package,
  RefreshCw,
  ShieldAlert,
  Smile,
  ShoppingCart,
  Store,
  Ticket,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMetricas } from "../../hooks/useMetricas";
import { storeService, type Store as StoreType } from "../../features/stores/storeService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { dateInputInBrasilia, formatBrasiliaDate } from "../../lib/dateTime";

function fmt(v: number | string | undefined | null) {
  if (v === undefined || v === null) return "R$ 0,00";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function num(v: number | string | undefined | null) {
  if (v === undefined || v === null) return "0";
  return Number(v).toLocaleString("pt-BR");
}

function labelMetodoPagamento(value: string | undefined | null) {
  const labels: Record<string, string> = {
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    pix: "PIX",
    cartao_credito: "Cartão crédito",
    cartao_debito: "Cartão débito",
    outros: "Outros",
  };
  return labels[String(value || "").toLowerCase()] || String(value || "Indefinido");
}

function labelCanalPagamento(value: string | undefined | null) {
  return value === "entrega" ? "Na entrega" : value === "app" ? "No app" : String(value || "Indefinido");
}

function labelSituacaoFinanceira(value: string | undefined | null) {
  const labels: Record<string, string> = {
    recebido: "Recebido",
    previsto: "Previsto",
    rejeitado: "Rejeitado",
    cancelado: "Cancelado",
    estornado: "Estornado",
    expirado: "Expirado",
    indefinido: "Indefinido",
  };
  return labels[String(value || "").toLowerCase()] || String(value || "Indefinido");
}

type PaymentMethodSummary = {
  metodo_pagamento?: string | null;
  valor_recebido?: number | string;
  valor_previsto_receber?: number | string;
};

type PaymentChannelSummary = {
  canal_pagamento?: string | null;
  quantidade?: number | string;
  valor_total?: number | string;
  valor_recebido?: number | string;
  valor_previsto_receber?: number | string;
  recebidos?: number | string;
  previstos?: number | string;
};

type PaymentStatusSummary = {
  situacao_financeira?: string | null;
  pagamento_status?: string | null;
  valor_total?: number | string;
  quantidade?: number | string;
};

type PaymentMethodChannelSummary = {
  metodo_pagamento?: string | null;
  canal_pagamento?: string | null;
  situacao_financeira?: string | null;
  quantidade?: number | string;
  valor_total?: number | string;
  valor_liquido?: number | string;
  taxas_gateway?: number | string;
};

type StoreExperienceSummary = {
  id: string;
  nome: string;
  total_avaliacoes?: number | string;
  nota_media?: number | string;
  otimo?: number | string;
  bom?: number | string;
  ruim?: number | string;
};

function MetricHelp({ text }: { text: string }) {
  return (
    <span className="relative inline-flex shrink-0 items-center">
      <button
        type="button"
        className="group/help inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={text}
      >
        <Info className="h-3.5 w-3.5" />
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-6 z-50 hidden w-72 rounded-md border bg-popover px-3 py-2 text-left text-xs font-normal leading-5 text-popover-foreground shadow-lg group-hover/help:block group-focus-visible/help:block"
        >
          {text}
        </span>
      </button>
    </span>
  );
}

function StatCard({ title, value, icon: Icon, sub, color = "text-primary", trend, help }: {
  title: string;
  value: string;
  icon: ElementType;
  sub?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
  help: string;
}) {
  return (
    <Card className="relative flex h-full min-h-[140px] flex-col overflow-visible group hover:shadow-lg transition-shadow duration-300">
      <div className={`absolute inset-0 opacity-[0.03] ${color.replace("text-", "bg-")}`} />
      <CardHeader className="relative flex min-h-[64px] flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="flex items-start gap-1.5 text-sm font-medium leading-5 text-muted-foreground">
          <span>{title}</span>
          <MetricHelp text={help} />
        </CardTitle>
        <div className={`shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col justify-end">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1 leading-4">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            <span>{sub}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// A API ainda retorna dois formatos diferentes para plataforma e loja; este adaptador centraliza essa compatibilidade.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDashboard(m: any) {
  if (m?.resumo) {
    return {
      scope: "platform" as const,
      resumo: m.resumo,
      pedidos: m.pedidos.metricas,
      financeiro: m.financeiro,
      entregas: m.entregas,
      estoque: m.estoque,
      carrinhos: m.carrinhos,
      cupons: m.cupons,
      auditoria: m.auditoria,
      experienciaCompra: m.experiencia_compra || { resumo: {}, por_loja: [] },
      topLojas: (m.rankings?.top_lojas_faturamento || []).slice(0, 5).map((l: { nome?: string; faturamento?: number | string }) => {
        const nome = l.nome || "Sem nome";
        return {
          nome: nome.length > 18 ? `${nome.slice(0, 18)}...` : nome,
          faturamento: Number(l.faturamento),
        };
      }),
      gerado_em: m.gerado_em,
    };
  }

  return {
    scope: "store" as const,
    loja: m.loja,
    resumo: {
      total_lojas: 1,
      lojas_ativas: m.loja?.status === "ativa" ? 1 : 0,
      lojas_inativas: m.loja?.status === "inativa" ? 1 : 0,
      total_clientes: m.novosClientes,
      clientes_ativos: m.novosClientes,
      clientes_bloqueados: 0,
      total_usuarios: m.contagens?.total_usuarios,
      usuarios_ativos: m.contagens?.total_usuarios,
      total_users_sistema: 0,
      total_produtos: m.contagens?.total_produtos,
      produtos_ativos: m.contagens?.produtos_ativos,
      total_categorias: m.contagens?.total_categorias,
      total_entregadores: m.contagens?.total_entregadores,
      entregadores_ativos: m.contagens?.total_entregadores,
      total_cupons: m.contagens?.total_cupons,
      cupons_ativos: m.contagens?.total_cupons,
    },
    pedidos: {
      total_pedidos: m.pedidos?.total_pedidos,
      pedidos_pendentes: m.pedidos?.pendentes,
      pedidos_confirmados: m.pedidos?.confirmados,
      pedidos_em_separacao: m.pedidos?.em_separacao,
      pedidos_prontos: m.pedidos?.prontos,
      pedidos_saiu_entrega: m.pedidos?.em_rota,
      pedidos_entregues: m.pedidos?.entregues,
      pedidos_cancelados: m.pedidos?.cancelados,
      valor_total_pedidos: m.pedidos?.valor_total,
      valor_pedidos_entregues: m.pedidos?.faturamento,
      total_descontos_aplicados: 0,
      total_taxas_entrega: 0,
      ticket_medio: m.pedidos?.ticket_medio,
    },
    financeiro: {
      pagamentos: {
        total_pagamentos: m.pagamentos?.total_pagamentos,
        pagamentos_aprovados: m.pagamentos?.aprovados,
        pagamentos_pendentes: 0,
        pagamentos_rejeitados: 0,
        pagamentos_estornados: 0,
        pagamentos_cancelados: 0,
        valor_total_aprovado: m.pagamentos?.valor_aprovado,
        total_taxas_gateway: m.pagamentos?.total_taxas_gateway,
        valor_liquido_total: Number(m.pagamentos?.valor_aprovado || 0) - Number(m.pagamentos?.total_taxas_gateway || 0),
      },
      pagamentos_detalhados: m.financeiro?.pagamentos_detalhados || m.pagamentos_detalhados || {
        resumo: {},
        por_forma_pagamento: [],
        por_canal_pagamento: [],
        por_forma_e_canal: [],
        por_status: [],
        recentes: [],
      },
      estornos: { total_estornos: 0, estornos_aprovados: 0, estornos_pendentes: 0, valor_total_estornado: 0 },
      splits: { total_splits: 0, splits_transferidos: 0, splits_pendentes: 0, splits_falharam: 0, valor_bruto_transferido: 0, valor_liquido_transferido: 0 },
      splits_apurados: m.financeiro?.splits_apurados || {
        resumo: {
          quantidade_pedidos_total: 0,
          quantidade_pedidos_cobrados: 0,
          valor_bruto_total: 0,
          valor_final_cobranca: 0,
        },
        categorias: [],
        pedidos_recentes: [],
      },
      webhooks: { total_notificacoes: 0, processadas: 0, nao_processadas: 0, com_erro: 0 },
    },
    entregas: { total_entregas: 0, entregas_aguardando: 0, entregas_atribuidas: 0, entregas_em_andamento: 0, entregas_concluidas: 0, entregas_falharam: 0 },
    estoque: {
      total_registros_estoque: m.estoque?.total_registros,
      produtos_estoque_baixo: m.estoque?.estoque_baixo,
      produtos_sem_estoque: m.estoque?.sem_estoque,
      total_quantidade_reservada: 0,
    },
    carrinhos: { total_carrinhos: 0, carrinhos_ativos: 0, carrinhos_convertidos: 0, carrinhos_abandonados: 0 },
    cupons: { total_usos: 0 },
    auditoria: { total_logs: 0 },
    experienciaCompra: m.experiencia_compra || { resumo: {}, por_loja: [] },
    topLojas: [],
    gerado_em: m.gerado_em,
  };
}

export default function Dashboard() {
  const [{ today, thirtyDaysAgo }] = useState(() => {
    const now = new Date();
    return {
      today: dateInputInBrasilia(now),
      thirtyDaysAgo: dateInputInBrasilia(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)),
    };
  });
  const [dataInicio, setDataInicio] = useState(thirtyDaysAgo);
  const [dataFim, setDataFim] = useState(today);
  const [lojaId, setLojaId] = useState("");

  const { data: storesData } = useQuery({
    queryKey: ["stores", "dashboard-filter"],
    queryFn: () => storeService.getAll(),
  });

  const stores: StoreType[] = Array.isArray(storesData?.data?.data)
    ? storesData.data.data
    : Array.isArray(storesData?.data)
      ? storesData.data
      : Array.isArray(storesData)
        ? storesData
        : [];

  const filters = useMemo(() => ({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    lojaId: lojaId || undefined,
  }), [dataInicio, dataFim, lojaId]);

  const { data, isLoading, error, refetch, isFetching } = useMetricas(filters);
  const m = data ? normalizeDashboard(data) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !m) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-semibold">Erro ao carregar métricas</h2>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message || "Verifique se o backend está rodando."}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const r = m.resumo;
  const ped = m.pedidos;
  const fin = m.financeiro;
  const pagamentosDetalhados = fin.pagamentos_detalhados || {};
  const resumoPagamentos = pagamentosDetalhados.resumo || {};
  const pagamentosPorForma = (pagamentosDetalhados.por_forma_pagamento || []) as PaymentMethodSummary[];
  const pagamentosPorCanal = (pagamentosDetalhados.por_canal_pagamento || []) as PaymentChannelSummary[];
  const pagamentosPorFormaCanal = (pagamentosDetalhados.por_forma_e_canal || []) as PaymentMethodChannelSummary[];
  const pagamentosPorStatus = (pagamentosDetalhados.por_status || []) as PaymentStatusSummary[];
  const experiencia = m.experienciaCompra?.resumo || {};
  const experienciaPorLoja = (m.experienciaCompra?.por_loja || []) as StoreExperienceSummary[];
  const totalPagamentosDetalhados = resumoPagamentos.total_pagamentos ?? fin.pagamentos.total_pagamentos;
  const pagamentosRecebidos = resumoPagamentos.pagamentos_recebidos ?? fin.pagamentos.pagamentos_aprovados;
  const valorRecebido = resumoPagamentos.valor_recebido ?? fin.pagamentos.valor_total_aprovado;
  const valorLiquidoRecebido = resumoPagamentos.valor_liquido_recebido ?? fin.pagamentos.valor_liquido_total;
  const taxasGatewayRecebidas = resumoPagamentos.taxas_gateway_recebidas ?? fin.pagamentos.total_taxas_gateway;
  const valorRegistrado = resumoPagamentos.valor_total_registrado ?? ped.valor_total_pedidos;
  const pagamentosPrevistos = resumoPagamentos.pagamentos_previstos ?? fin.pagamentos.pagamentos_pendentes;
  const valorPrevisto = resumoPagamentos.valor_previsto_receber ?? 0;
  const pagamentosEstornados = resumoPagamentos.pagamentos_estornados ?? fin.estornos.estornos_aprovados;
  const valorEstornado = resumoPagamentos.valor_estornado ?? fin.estornos.valor_total_estornado;
  const resumoCanal = (canal: "entrega" | "app") =>
    pagamentosPorCanal.find((item) => item.canal_pagamento === canal) || {
      quantidade: 0,
      valor_total: 0,
      valor_recebido: 0,
      valor_previsto_receber: 0,
      recebidos: 0,
      previstos: 0,
    };
  const canalEntrega = resumoCanal("entrega");
  const canalApp = resumoCanal("app");
  const splitApurado = fin.splits_apurados || {
    resumo: {
      quantidade_pedidos_total: 0,
      quantidade_pedidos_cobrados: 0,
      valor_bruto_total: 0,
      valor_final_cobranca: 0,
    },
    categorias: [],
  };
  const splitResumo = splitApurado.resumo || {};
  const splitCategorias = Array.isArray(splitApurado.categorias) ? splitApurado.categorias : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {m.scope === "store" ? `Dashboard da Loja: ${m.loja?.nome || "Selecionada"}` : "Visão Geral da Plataforma"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Atualizado em {m.gerado_em ? formatBrasiliaDate(m.gerado_em, { dateStyle: "short", timeStyle: "short" }) : "-"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[680px]">
          <div className="space-y-1">
            <Label htmlFor="dataInicio">Início</Label>
            <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dataFim">Fim</Label>
            <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lojaId">Loja</Label>
            <select
              id="lojaId"
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todas as lojas</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lojas Ativas" value={num(r.lojas_ativas)} icon={Store}
          sub={`${num(r.total_lojas)} total · ${num(r.lojas_inativas)} inativas`} color="text-indigo-500"
          help="Quantidade de lojas cadastradas com status ativo. O total e as inativas mostram a situação atual do cadastro no escopo selecionado." />
        <StatCard title="Clientes Ativos" value={num(r.clientes_ativos)} icon={Users}
          sub={`${num(r.total_clientes)} total · ${num(r.clientes_bloqueados)} bloqueados`} color="text-cyan-500"
          help="Clientes cadastrados que não estão bloqueados. Esta é uma contagem cadastral do escopo selecionado, não uma soma de compras do período." />
        <StatCard title="Faturamento (Entregues)" value={fmt(ped.valor_pedidos_entregues)} icon={DollarSign}
          sub={`${fmt(ped.valor_total_pedidos)} em pedidos totais`} color="text-emerald-500" trend="up"
          help="Soma do campo total apenas dos pedidos com status entregue dentro do período filtrado. O subtítulo mostra o valor bruto de todos os pedidos do período, incluindo outros status." />
        <StatCard title="Ticket Médio dos Pedidos" value={fmt(ped.ticket_medio)} icon={TrendingUp}
          sub={`${num(ped.total_pedidos)} pedidos realizados`} color="text-violet-500"
          help="Média do valor total dos pedidos criados ou realizados no período filtrado. Pode incluir pedidos ainda não entregues, cancelados ou não concluídos conforme vierem da base de pedidos." />
        <StatCard title="Pedidos Totais" value={num(ped.total_pedidos)} icon={ShoppingCart}
          sub={`${num(ped.pedidos_entregues)} entregues · ${num(ped.pedidos_cancelados)} cancelados`} color="text-blue-500"
          help="Quantidade de pedidos encontrados no período filtrado, somando todos os status. Use entregues e cancelados no subtítulo para comparar conversão operacional." />
        <StatCard title="Experiência" value={num(experiencia.total_avaliacoes)} icon={Smile}
          sub={`${num(experiencia.otimo)} ótimo · ${num(experiencia.bom)} bom · ${num(experiencia.ruim)} ruim`}
          color="text-rose-500"
          help="Total de avaliações simples registradas pelos clientes no fim do pedido dentro do período filtrado, separadas entre ótimo, bom e ruim." />
        <StatCard title="Produtos Ativos" value={num(r.produtos_ativos)} icon={Package}
          sub={`${num(r.total_produtos)} total · ${num(r.total_categorias)} categorias`} color="text-orange-500"
          help="Produtos com status ativo no cadastro atual do escopo selecionado. O total inclui todos os produtos cadastrados, ativos ou não." />
        <StatCard title="Entregadores Ativos" value={num(r.entregadores_ativos)} icon={Truck}
          sub={`${num(r.total_entregadores)} cadastrados`} color="text-teal-500"
          help="Entregadores com status ativo no cadastro atual. O subtítulo mostra todos os entregadores cadastrados no escopo selecionado." />
        <StatCard title="Usuários do Sistema" value={num(r.usuarios_ativos)} icon={UserCheck}
          sub={`${num(r.total_usuarios)} total · ${num(r.total_users_sistema)} users auth`} color="text-pink-500"
          help="Usuários administrativos ativos no cadastro da plataforma. O total mostra usuários administrativos cadastrados; users auth mostra registros vinculados à autenticação quando disponível." />
      </div>

      {m.topLojas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              Top Lojas por Faturamento
              <MetricHelp text="Ranking das lojas com maior soma de pedidos entregues dentro do período filtrado. O gráfico usa o mesmo conceito do card Faturamento (Entregues)." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={m.topLojas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v) => fmt(v as number | string | undefined)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--popover-foreground))",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Bar dataKey="faturamento" fill="#6366f1" radius={[0, 6, 6, 0]} name="Faturamento" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {experienciaPorLoja.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smile className="h-4 w-4 text-rose-500" aria-hidden="true" />
              Experiência por Loja
              <MetricHelp text="Lista as lojas com avaliações registradas no período filtrado. A média usa ruim como 1, bom como 2 e ótimo como 3." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {experienciaPorLoja.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {num(item.total_avaliacoes)} respostas · média {Number(item.nota_media || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <span className="font-semibold text-emerald-600">{num(item.otimo)}</span> ótimo ·{" "}
                    <span className="font-semibold text-amber-600">{num(item.bom)}</span> bom ·{" "}
                    <span className="font-semibold text-red-600">{num(item.ruim)}</span> ruim
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pagamentos Recebidos" value={fmt(valorRecebido)} icon={CreditCard}
          sub={`${num(pagamentosRecebidos)} de ${num(totalPagamentosDetalhados)} pagamento(s)`} color="text-emerald-500" trend="up"
          help="Soma apenas dos pagamentos classificados como recebidos: status aprovado ou pagamento com data de recebimento, sem contar cancelados, rejeitados, expirados ou estornados." />
        <StatCard title="Valor Líquido Recebido" value={fmt(valorLiquidoRecebido)} icon={DollarSign}
          sub={`Taxas do gateway recebidas: ${fmt(taxasGatewayRecebidas)}`} color="text-green-500"
          help="Valor recebido descontando as taxas de gateway registradas nos próprios pagamentos recebidos. Pagamentos na entrega normalmente não têm taxa de gateway." />
        <StatCard title="Pagamentos Estornados" value={fmt(valorEstornado)} icon={RefreshCw}
          sub={`${num(pagamentosEstornados)} pagamento(s) estornado(s)`}
          color="text-amber-500" trend={Number(pagamentosEstornados) > 0 ? "down" : "neutral"}
          help="Soma dos pagamentos cujo status financeiro é estornado. Esses valores não entram em Pagamentos Recebidos, mesmo que tenham data de pagamento registrada." />
        <StatCard title="Split da Plataforma" value={fmt(splitResumo.valor_final_cobranca)} icon={ArrowUpRight}
          sub={`${num(splitResumo.quantidade_pedidos_cobrados)} de ${num(splitResumo.quantidade_pedidos_total)} pedido(s) - ${fmt(splitResumo.valor_bruto_total)} bruto`}
          color="text-indigo-500"
          help="Valor apurado pelo sistema com base nos pedidos do periodo e nos checks ativos da regra de split: app do cliente, admin entrega/retirada, salao e fiado com ou sem taxa registrada." />
      </div>

      {splitCategorias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              Detalhamento do Split
              <MetricHelp text="Quebra do split apurado por categoria de pedido configurada na regra ativa de cada loja." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {splitCategorias.map((category: any) => (
                <div key={category.categoria} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{category.label || category.categoria}</p>
                      <p className="text-xs text-muted-foreground">
                        {num(category.quantidade_cobrada)} de {num(category.quantidade_pedidos)} pedido(s)
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-lg font-bold">{fmt(category.valor_cobranca)}</p>
                    <p className="text-xs text-muted-foreground">Bruto {fmt(category.valor_bruto)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Registrado" value={fmt(valorRegistrado)} icon={DollarSign}
          sub={`${num(totalPagamentosDetalhados)} pagamento(s), todos os status`}
          color="text-slate-500"
          help="Soma bruta de todos os registros de pagamento no período, independentemente do status. Use para conciliar o movimento total; não representa dinheiro recebido." />
        <StatCard title="Previsto a Receber" value={fmt(valorPrevisto)} icon={Clock}
          sub={`${num(pagamentosPrevistos)} pagamento(s) pendente(s)`}
          color="text-amber-500"
          help="Pagamentos pendentes, em processamento ou processando. Esses valores ainda não são considerados recebidos e podem mudar de status." />
        <StatCard title="Recebido na Entrega" value={fmt(canalEntrega.valor_recebido)} icon={Truck}
          sub={`${num(canalEntrega.recebidos)} recebido(s) · ${fmt(canalEntrega.valor_total)} registrado(s)`}
          color="text-cyan-500"
          help="Parte recebida dos pagamentos marcados para cobrança presencial na entrega, como dinheiro ou cartão sem gateway. O valor registrado no subtítulo inclui todos os status desse canal." />
        <StatCard title="Recebido no App" value={fmt(canalApp.valor_recebido)} icon={CreditCard}
          sub={`${num(canalApp.recebidos)} recebido(s) · ${fmt(canalApp.valor_total)} registrado(s)`}
          color="text-violet-500"
          help="Parte recebida dos pagamentos processados pelo checkout do app, como PIX ou cartão via gateway. O valor registrado no subtítulo inclui aprovados, pendentes, rejeitados, cancelados, expirados e estornados." />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MiniSummary icon={DollarSign} title="Por Forma de Pagamento" color="text-emerald-500" rows={
          pagamentosPorForma.length
            ? pagamentosPorForma.map((item) => [
                labelMetodoPagamento(item.metodo_pagamento),
                `${fmt(item.valor_recebido)} receb. · ${fmt(item.valor_previsto_receber)} prev.`,
              ])
            : [["Sem dados", fmt(0)]]
        } help="Mostra quanto já foi recebido e quanto ainda está previsto por forma de pagamento. Valores rejeitados, cancelados, expirados ou estornados aparecem na distribuição de Status Financeiro." />
        <MiniSummary icon={Truck} title="Por Canal de Pagamento" color="text-cyan-500" rows={
          pagamentosPorCanal.length
            ? pagamentosPorCanal.map((item) => [
                labelCanalPagamento(item.canal_pagamento),
                `${fmt(item.valor_recebido)} receb. · ${fmt(item.valor_previsto_receber)} prev.`,
              ])
            : [["Sem dados", fmt(0)]]
        } help="Separa pagamentos do checkout do app e pagamentos cobrados na entrega. Cada linha exibe apenas o valor recebido e o valor previsto desse canal." />
        <MiniSummary icon={AlertTriangle} title="Status Financeiro" color="text-amber-500" rows={
          pagamentosPorStatus.length
            ? pagamentosPorStatus.map((item) => [
                `${labelSituacaoFinanceira(item.situacao_financeira)} (${item.pagamento_status || "-"})`,
                `${fmt(item.valor_total)} · ${num(item.quantidade)}`,
              ])
            : [["Sem dados", fmt(0)]]
        } help="Agrupa os pagamentos pela situação financeira usada nos cards e pelo status original gravado no pagamento. É a melhor visão para explicar diferenças entre total registrado e recebido." />
      </div>

      {pagamentosPorFormaCanal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
              Detalhamento de Pagamentos
              <MetricHelp text="Quebra os pagamentos por forma, canal e situação financeira. Use esta seção para conferir quais valores foram recebidos, previstos, rejeitados, cancelados, expirados ou estornados." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pagamentosPorFormaCanal.map((item) => (
                <div key={`${item.metodo_pagamento}-${item.canal_pagamento}-${item.situacao_financeira}`} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{labelMetodoPagamento(item.metodo_pagamento)}</p>
                      <p className="text-xs text-muted-foreground">{labelCanalPagamento(item.canal_pagamento)} · {labelSituacaoFinanceira(item.situacao_financeira)}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{num(item.quantidade)}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{fmt(item.valor_total)}</p>
                      <p className="text-xs text-muted-foreground">Líquido {fmt(item.valor_liquido)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Taxas {fmt(item.taxas_gateway)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniSummary icon={Truck} title="Entregas" color="text-teal-500" rows={[
          ["Total", num(m.entregas.total_entregas)],
          ["Aguardando", num(m.entregas.entregas_aguardando)],
          ["Em andamento", num(m.entregas.entregas_em_andamento)],
          ["Concluídas", num(m.entregas.entregas_concluidas)],
        ]} help="Resumo operacional das entregas registradas no escopo selecionado. A plataforma geral pode representar o estado atual das entregas, não necessariamente apenas o período dos pedidos." />
        <MiniSummary icon={Box} title="Estoque" color="text-orange-500" rows={[
          ["Registros", num(m.estoque.total_registros_estoque)],
          ["Estoque baixo", num(m.estoque.produtos_estoque_baixo)],
          ["Sem estoque", num(m.estoque.produtos_sem_estoque)],
          ["Reservados", num(m.estoque.total_quantidade_reservada)],
        ]} help="Situação atual dos registros de estoque no escopo selecionado. Estoque baixo compara quantidade disponível com quantidade mínima; sem estoque indica quantidade disponível igual a zero." />
        <MiniSummary icon={ShoppingCart} title="Carrinhos" color="text-violet-500" rows={[
          ["Total", num(m.carrinhos.total_carrinhos)],
          ["Ativos", num(m.carrinhos.carrinhos_ativos)],
          ["Convertidos", num(m.carrinhos.carrinhos_convertidos)],
          ["Abandonados", num(m.carrinhos.carrinhos_abandonados)],
        ]} help="Resumo dos carrinhos registrados por status. Ativos ainda estão em aberto, convertidos viraram pedido e abandonados ficaram sem conclusão." />
        <MiniSummary icon={Ticket} title="Cupons & Auditoria" color="text-pink-500" rows={[
          ["Cupons ativos", num(r.cupons_ativos)],
          ["Usos de cupom", num(m.cupons.total_usos)],
          ["Logs auditoria", num(m.auditoria.total_logs)],
          ["Webhooks", `${num(fin.webhooks.processadas)}/${num(fin.webhooks.total_notificacoes)}`],
        ]} help="Acompanha cupons ativos, uso de cupons, logs administrativos e webhooks de pagamento processados. Em Webhooks, o formato é processados sobre total recebido." />
      </div>

      {(Number(m.estoque.produtos_sem_estoque) > 0 || Number(fin.webhooks.com_erro) > 0 || Number(fin.pagamentos.pagamentos_rejeitados) > 0) && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Alertas
              <MetricHelp text="Mostra somente indicadores que precisam de atenção operacional, como produto sem estoque, webhook com erro ou pagamento rejeitado." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Number(m.estoque.produtos_sem_estoque) > 0 && <p className="text-amber-700 dark:text-amber-400">{num(m.estoque.produtos_sem_estoque)} produto(s) sem estoque</p>}
            {Number(fin.webhooks.com_erro) > 0 && <p className="text-amber-700 dark:text-amber-400">{num(fin.webhooks.com_erro)} webhook(s) com erro de processamento</p>}
            {Number(fin.pagamentos.pagamentos_rejeitados) > 0 && <p className="text-amber-700 dark:text-amber-400">{num(fin.pagamentos.pagamentos_rejeitados)} pagamento(s) rejeitado(s)</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniSummary({ icon: Icon, title, rows, color, help }: {
  icon: ElementType;
  title: string;
  rows: Array<[string, string]>;
  color: string;
  help: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
          {title}
          <MetricHelp text={help} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
