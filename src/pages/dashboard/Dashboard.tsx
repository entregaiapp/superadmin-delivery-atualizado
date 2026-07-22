import { useMemo, useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DollarSign,
  HandCoins,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  TrendingUp,
  Utensils,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { storeService, type Store as StoreType } from "../../features/stores/storeService";
import {
  superadminDashboardService,
  type CaptureChannel,
  type ChannelMatrixRow,
  type DashboardFilters,
  type FinancialStatus,
  type LabeledMoneyBucket,
  type OrderOriginPercentagePoint,
  type OrderSource,
  type PaymentMethod,
} from "../../features/financial/superadminDashboardService";
import { dateInputInBrasilia, formatBrasiliaDate } from "../../lib/dateTime";

const controlClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

const sourceOptions: Array<{ key: OrderSource; label: string; icon: ElementType; color: string }> = [
  { key: "CUSTOMER_APP", label: "App do cliente", icon: CreditCard, color: "text-violet-600" },
  { key: "ADMIN", label: "Painel administrativo", icon: Store, color: "text-blue-600" },
  { key: "SALON", label: "Salão", icon: Utensils, color: "text-amber-600" },
  { key: "UNKNOWN", label: "Origem desconhecida", icon: AlertTriangle, color: "text-red-600" },
];

const captureLabels: Record<string, string> = {
  ONLINE_GATEWAY: "Online",
  EXTERNAL_OR_OFFLINE: "Offline",
  CREDIT_TAB: "Fiado",
};

const methodLabels: Record<string, string> = {
  PIX: "Pix",
  CARD: "Cartão",
  CASH: "Dinheiro",
  CREDIT_TAB: "Fiado",
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Recebido",
  PENDING: "Pendente",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
  UNDEFINED: "Indefinido",
};

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function percentage(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function MetricCard({ title, value, description, icon: Icon, color = "text-slate-700" }: {
  title: string;
  value: number;
  description: string;
  icon: ElementType;
  color?: string;
}) {
  return (
    <Card className="h-full border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="flex h-full min-h-32 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xl font-bold tracking-tight">{money(value)}</p>
          <p className="mt-1 text-xs leading-4 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, description, icon: Icon }: { title: string; description: string; icon: ElementType }) {
  return (
    <div className="flex items-start gap-3 pt-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function OriginCard({ option, bucket }: { option: typeof sourceOptions[number]; bucket?: LabeledMoneyBucket }) {
  const Icon = option.icon;
  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className={`h-4 w-4 ${option.color}`} aria-hidden="true" />
          {option.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <ValueRow label="Recebido" value={bucket?.valor_recebido} strong />
        <ValueRow label="Líquido" value={bucket?.valor_liquido_recebido} />
        <ValueRow label="Pendente" value={bucket?.valor_pendente} />
        <ValueRow label="Estornado" value={bucket?.valor_estornado} />
        <ValueRow label="Registrado" value={bucket?.valor_registrado} />
      </CardContent>
    </Card>
  );
}

function ValueRow({ label, value, strong = false }: { label: string; value?: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold text-foreground" : "font-medium"}>{money(value)}</span>
    </div>
  );
}

function ChannelTable({ title, rows }: { title: string; rows: ChannelMatrixRow[] }) {
  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum valor encontrado para esta origem.
          </div>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Forma</th>
                <th className="px-3 py-2 text-right">Recebido</th>
                <th className="px-3 py-2 text-right">Pendente</th>
                <th className="px-3 py-2 text-right">Estornado</th>
                <th className="py-2 pl-3 text-right">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.payment_capture_channel}-${row.payment_method}`} className="border-b last:border-0">
                  <td className="py-3 pr-3 font-medium">{captureLabels[row.payment_capture_channel] || row.payment_capture_channel}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{methodLabels[row.payment_method] || row.payment_method}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">{money(row.valor_recebido)}</td>
                  <td className="px-3 py-3 text-right">{money(row.valor_pendente)}</td>
                  <td className="px-3 py-3 text-right">{money(row.valor_estornado)}</td>
                  <td className="py-3 pl-3 text-right">{money(row.valor_liquido_recebido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function makePeriod(preset: string) {
  const end = new Date();
  const start = new Date(end);
  if (preset === "ontem") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else {
    const days = preset === "7dias" ? 6 : preset === "90dias" ? 89 : preset === "30dias" ? 29 : 0;
    start.setDate(start.getDate() - days);
  }
  return { dataInicio: dateInputInBrasilia(start), dataFim: dateInputInBrasilia(end) };
}

export default function Dashboard() {
  const initialPeriod = useMemo(() => makePeriod("30dias"), []);
  const [preset, setPreset] = useState("30dias");
  const [draft, setDraft] = useState<DashboardFilters>({ ...initialPeriod, dateType: "payment" });
  const [applied, setApplied] = useState<DashboardFilters>({ ...initialPeriod, dateType: "payment" });

  const storesQuery = useQuery({
    queryKey: ["stores", "financial-dashboard-filter"],
    queryFn: () => storeService.getAll(),
  });
  const stores: StoreType[] = Array.isArray(storesQuery.data?.data?.data)
    ? storesQuery.data.data.data
    : Array.isArray(storesQuery.data?.data)
      ? storesQuery.data.data
      : Array.isArray(storesQuery.data)
        ? storesQuery.data
        : [];

  const dashboardQuery = useQuery({
    queryKey: ["superadmin-financial-dashboard", applied],
    queryFn: () => superadminDashboardService.get(applied),
    staleTime: 60_000,
  });

  const invalidPeriod = Boolean(draft.dataInicio && draft.dataFim && draft.dataInicio > draft.dataFim);

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Carregando visão financeira...</p>
        </div>
      </div>
    );
  }

  if (dashboardQuery.error || !dashboardQuery.data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-4 pt-6 text-center">
            <AlertTriangle className="mx-auto h-11 w-11 text-red-500" />
            <div>
              <h2 className="font-semibold">Não foi possível carregar o dashboard financeiro</h2>
              <p className="mt-1 text-sm text-muted-foreground">{(dashboardQuery.error as Error)?.message || "Verifique a conexão com o backend."}</p>
            </div>
            <Button variant="outline" onClick={() => dashboardQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = dashboardQuery.data;
  const orderOriginEvolution = data.evolucao_percentual_pedidos || [];
  const summary = data.resumo;
  const platform = data.taxa_plataforma.resumo;
  const originMap = new Map(data.por_origem.map((item) => [item.key, item]));
  const selectedStore = stores.find((store) => store.id === applied.lojaId);
  const hasAlerts = data.alertas.origem_desconhecida !== 0
    || data.alertas.canal_indefinido !== 0
    || data.alertas.metodo_indefinido !== 0
    || data.alertas.fiado_sem_origem !== 0
    || data.alertas.lojas_sem_regra.length > 0
    || data.alertas.diferenca_conciliacao !== 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl bg-slate-900 p-5 text-white shadow-sm dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-300">Financeiro da plataforma</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Visão geral por canais de pagamento</h2>
            <p className="mt-1 text-sm text-slate-300">
              Valores consolidados de {selectedStore?.nome || "todas as lojas"}, sem exibição de pedidos individuais.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-3 text-sm">
            <p className="text-xs text-slate-300">Período consultado</p>
            <p className="mt-0.5 font-semibold">{dateLabel(applied.dataInicio)} a {dateLabel(applied.dataFim)}</p>
            <p className="mt-1 text-xs text-slate-300">
              Referência: {applied.dateType === "order" ? "data do pedido" : "data do pagamento"}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b bg-slate-50/80 pb-4 dark:bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Filtros da consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="preset">Período rápido</Label>
              <select id="preset" value={preset} className={controlClass} onChange={(event) => {
                const value = event.target.value;
                setPreset(value);
                if (value !== "personalizado") setDraft((current) => ({ ...current, ...makePeriod(value) }));
              }}>
                <option value="hoje">Hoje</option>
                <option value="ontem">Ontem</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="90dias">Últimos 90 dias</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio">Data inicial</Label>
              <Input id="dataInicio" type="date" value={draft.dataInicio} onChange={(event) => {
                setPreset("personalizado");
                setDraft((current) => ({ ...current, dataInicio: event.target.value }));
              }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFim">Data final</Label>
              <Input id="dataFim" type="date" value={draft.dataFim} onChange={(event) => {
                setPreset("personalizado");
                setDraft((current) => ({ ...current, dataFim: event.target.value }));
              }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateType">Referência das datas</Label>
              <select id="dateType" className={controlClass} value={draft.dateType} onChange={(event) => setDraft((current) => ({ ...current, dateType: event.target.value as "payment" | "order" }))}>
                <option value="payment">Data do pagamento</option>
                <option value="order">Data do pedido</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store">Loja</Label>
              <select id="store" className={controlClass} value={draft.lojaId || ""} onChange={(event) => setDraft((current) => ({ ...current, lojaId: event.target.value }))}>
                <option value="">Todas as lojas</option>
                {stores.map((store) => <option key={store.id} value={store.id}>{store.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Origem</Label>
              <select id="source" className={controlClass} value={draft.orderSource || ""} onChange={(event) => setDraft((current) => ({ ...current, orderSource: event.target.value as OrderSource | "" }))}>
                <option value="">Todas as origens</option>
                {sourceOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capture">Canal de captura</Label>
              <select id="capture" className={controlClass} value={draft.captureChannel || ""} onChange={(event) => setDraft((current) => ({ ...current, captureChannel: event.target.value as CaptureChannel | "" }))}>
                <option value="">Todos os canais</option>
                <option value="ONLINE_GATEWAY">Online</option>
                <option value="EXTERNAL_OR_OFFLINE">Offline</option>
                <option value="CREDIT_TAB">Fiado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="method">Forma de pagamento</Label>
              <select id="method" className={controlClass} value={draft.paymentMethod || ""} onChange={(event) => setDraft((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod | "" }))}>
                <option value="">Todas as formas</option>
                <option value="PIX">Pix</option>
                <option value="CARD">Cartão</option>
                <option value="CASH">Dinheiro</option>
                <option value="CREDIT_TAB">Fiado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Situação financeira</Label>
              <select id="status" className={controlClass} value={draft.financialStatus || ""} onChange={(event) => setDraft((current) => ({ ...current, financialStatus: event.target.value as FinancialStatus | "" }))}>
                <option value="">Todas as situações</option>
                {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 xl:col-span-3">
              <Button className="w-full sm:w-auto" disabled={invalidPeriod || dashboardQuery.isFetching} onClick={() => setApplied({ ...draft })}>
                {dashboardQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Consultar valores
              </Button>
            </div>
          </div>
          {invalidPeriod && <p className="mt-3 text-sm font-medium text-red-600">A data inicial não pode ser posterior à data final.</p>}
        </CardContent>
      </Card>

      <SectionTitle title="Resumo financeiro" description="Entradas, pendências e ajustes do período pesquisado." icon={CircleDollarSign} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Efetivamente recebido" value={summary.total_efetivamente_recebido} description="Pagamentos e baixas de fiado que atendem a todos os filtros." icon={CheckCircle2} color="text-emerald-600" />
        <MetricCard title="Recebido em pagamentos" value={summary.valor_recebido} description="Valores recebidos nos pagamentos vinculados ao período." icon={DollarSign} color="text-green-600" />
        <MetricCard title="Líquido recebido" value={summary.valor_liquido_recebido} description="Recebido após as taxas do gateway." icon={Landmark} color="text-cyan-600" />
        <MetricCard title="Pendente" value={summary.valor_pendente} description="Valores registrados que ainda aguardam recebimento." icon={Clock3} color="text-amber-600" />
        <MetricCard title="Total registrado" value={summary.valor_registrado} description="Todos os pagamentos, independentemente da situação." icon={WalletCards} color="text-slate-600" />
        <MetricCard title="Taxas do gateway" value={summary.taxas_gateway} description="Custos dos meios de pagamento online recebidos." icon={CreditCard} color="text-violet-600" />
        <MetricCard title="Estornado" value={summary.valor_estornado} description="Valores devolvidos ou marcados como estornados." icon={RefreshCw} color="text-orange-600" />
        <MetricCard title="Cancelado ou rejeitado" value={summary.valor_cancelado + summary.valor_rejeitado + summary.valor_expirado} description="Valores que não representam entrada financeira." icon={AlertTriangle} color="text-red-600" />
      </div>

      <SectionTitle title="Entradas por origem" description="Valores originados no app do cliente, no painel administrativo e no salão." icon={WalletCards} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sourceOptions.map((option) => <OriginCard key={option.key} option={option} bucket={originMap.get(option.key)} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChannelTable title="App do cliente" rows={data.matriz_canais.filter((row) => row.order_source === "CUSTOMER_APP")} />
        <ChannelTable title="Painel administrativo" rows={data.matriz_canais.filter((row) => row.order_source === "ADMIN")} />
        <ChannelTable title="Salão" rows={data.matriz_canais.filter((row) => row.order_source === "SALON")} />
      </div>

      <SectionTitle title="Evolução dos recebimentos" description="Distribuição diária dos valores recebidos por origem." icon={CalendarDays} />
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="pt-6">
          {data.evolucao_diaria.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Nenhum valor recebido no período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.evolucao_diaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tickFormatter={dateLabel} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => Number(value).toLocaleString("pt-BR", { notation: "compact" })} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => money(Number(value))} labelFormatter={(label) => dateLabel(String(label))} />
                <Legend />
                <Bar dataKey="app" name="App do cliente" stackId="recebimentos" fill="#7c3aed" />
                <Bar dataKey="admin" name="Painel administrativo" stackId="recebimentos" fill="#2563eb" />
                <Bar dataKey="salao" name="Salão" stackId="recebimentos" fill="#d97706" />
                <Bar dataKey="desconhecido" name="Desconhecido" stackId="recebimentos" fill="#dc2626" />
                <Bar dataKey="fiado" name="Baixas de fiado" stackId="recebimentos" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <SectionTitle
        title="Participação dos pedidos por origem"
        description="Percentual diário de pedidos criados no app do cliente e no painel administrativo, considerando o período e a loja selecionados."
        icon={TrendingUp}
      />
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="pt-6">
          {orderOriginEvolution.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Nenhum pedido do app ou do painel administrativo no período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={orderOriginEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tickFormatter={dateLabel} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={percentage} tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(label) => dateLabel(String(label))}
                  formatter={(value, name, item) => {
                    const point = item.payload as OrderOriginPercentagePoint;
                    const count = item.dataKey === "percentual_app" ? point.quantidade_app : point.quantidade_admin;
                    const orderLabel = count === 1 ? "pedido" : "pedidos";
                    return [`${percentage(Number(value))} (${count.toLocaleString("pt-BR")} ${orderLabel})`, String(name)];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentual_app"
                  name="App do cliente"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="percentual_admin"
                  name="Painel administrativo"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <SectionTitle title="Taxa da plataforma" description="Cálculo dinâmico com a regra de split ativa no momento desta consulta." icon={HandCoins} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Base elegível" value={platform.base_elegivel} description="Base atual que participa da cobrança da plataforma." icon={DollarSign} color="text-blue-600" />
        <MetricCard title="Taxa calculada" value={platform.taxa_calculada} description="Valor calculado conforme a regra ativa de cada loja." icon={CircleDollarSign} color="text-indigo-600" />
        <MetricCard title="Taxa líquida" value={platform.taxa_liquida} description="Taxa calculada após estornos proporcionais." icon={HandCoins} color="text-violet-600" />
        <MetricCard title="Split recebido" value={platform.split_recebido} description="Valor confirmado ou liquidado para a plataforma." icon={CheckCircle2} color="text-emerald-600" />
        <MetricCard title="Split pendente" value={platform.split_pendente} description="Valor online ainda aguardando liquidação." icon={Clock3} color="text-amber-600" />
        <MetricCard title="A cobrar da loja" value={platform.valor_a_cobrar} description="Taxa relativa a pagamentos externos ou offline." icon={Store} color="text-orange-600" />
        <MetricCard title="Taxa estornada" value={platform.taxa_estornada} description="Parcela da taxa reduzida por estornos." icon={RefreshCw} color="text-red-600" />
        <MetricCard title="Diferença" value={platform.diferenca_conciliacao} description={platform.diferenca_conciliacao === 0 ? "Valores conciliados." : "Há valor que precisa ser conferido."} icon={ShieldCheck} color={platform.diferenca_conciliacao === 0 ? "text-emerald-600" : "text-red-600"} />
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4 text-primary" /> Conciliação por loja</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.taxa_plataforma.por_loja.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum valor encontrado para as lojas selecionadas.</div>
          ) : (
            <table className="w-full min-w-[1420px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">Loja</th>
                  <th className="px-3 py-2">Regra ativa</th>
                  <th className="px-3 py-2 text-right">App</th>
                  <th className="px-3 py-2 text-right">Admin</th>
                  <th className="px-3 py-2 text-right">Salão</th>
                  <th className="px-3 py-2 text-right">Online</th>
                  <th className="px-3 py-2 text-right">Offline</th>
                  <th className="px-3 py-2 text-right">Taxa líquida</th>
                  <th className="px-3 py-2 text-right">Split recebido</th>
                  <th className="px-3 py-2 text-right">Split pendente</th>
                  <th className="px-3 py-2 text-right">A cobrar</th>
                  <th className="px-3 py-2 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {data.taxa_plataforma.por_loja.map((row) => (
                  <tr key={row.loja_id} className="border-b last:border-0">
                    <td className="px-3 py-3 font-semibold">{row.loja_nome}</td>
                    <td className="px-3 py-3">
                      {row.regra_split ? (
                        <div>
                          <p className="font-medium">{row.regra_split.nome || "Regra ativa"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.regra_split.tipo_valor === "percentual" ? `${row.regra_split.valor}%` : money(row.regra_split.valor)}
                          </p>
                        </div>
                      ) : <span className="font-medium text-red-600">Sem regra</span>}
                    </td>
                    <td className="px-3 py-3 text-right">{money(row.app_recebido)}</td>
                    <td className="px-3 py-3 text-right">{money(row.admin_recebido)}</td>
                    <td className="px-3 py-3 text-right">{money(row.salao_recebido)}</td>
                    <td className="px-3 py-3 text-right">{money(row.online_recebido)}</td>
                    <td className="px-3 py-3 text-right">{money(row.offline_recebido)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{money(row.taxa_liquida)}</td>
                    <td className="px-3 py-3 text-right">{money(row.split_recebido)}</td>
                    <td className="px-3 py-3 text-right">{money(row.split_pendente)}</td>
                    <td className="px-3 py-3 text-right">{money(row.valor_a_cobrar)}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${row.diferenca_conciliacao === 0 ? "text-emerald-600" : "text-red-600"}`}>{money(row.diferenca_conciliacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <SectionTitle title="Fiado" description="Crédito conforme os pedidos; baixas entram pela data do pagamento e seguem a origem dos pedidos aos quais foram alocadas." icon={Landmark} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Fiado lançado" value={data.fiado.valor_lancado} description="Valor registrado como crédito no período." icon={Landmark} color="text-violet-600" />
        <MetricCard title="Saldo pendente" value={data.fiado.saldo_pendente} description="Valor de fiado ainda tratado separadamente das entradas." icon={Clock3} color="text-amber-600" />
        <MetricCard title="Fiado recebido" value={data.fiado.valor_recebido} description="Baixas de fiado recebidas entre as datas." icon={CheckCircle2} color="text-emerald-600" />
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recebimentos por forma</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.fiado.recebimentos_por_metodo.length
              ? data.fiado.recebimentos_por_metodo.map((item) => <ValueRow key={item.payment_method} label={methodLabels[item.payment_method] || item.payment_method} value={item.valor_recebido} />)
              : <p className="text-sm text-muted-foreground">Nenhuma baixa no período.</p>}
          </CardContent>
        </Card>
      </div>

      <SectionTitle title="Situação financeira" description="Distribuição dos valores registrados conforme o estado atual de cada pagamento." icon={ShieldCheck} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.por_situacao.map((item) => (
          <MetricCard key={item.key} title={item.label || statusLabels[item.key] || item.key} value={item.valor_registrado} description={`Recebido ${money(item.valor_recebido)} · Pendente ${money(item.valor_pendente)}`} icon={item.key === "RECEIVED" ? CheckCircle2 : item.key === "PENDING" ? Clock3 : AlertTriangle} color={item.key === "RECEIVED" ? "text-emerald-600" : item.key === "PENDING" ? "text-amber-600" : "text-red-600"} />
        ))}
      </div>

      {hasAlerts && (
        <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-300"><AlertTriangle className="h-4 w-4" /> Pontos para conferência</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            {data.alertas.origem_desconhecida !== 0 && <div className="rounded-lg border border-amber-200 bg-white/70 p-3 dark:bg-slate-950/40"><p className="text-muted-foreground">Origem desconhecida</p><p className="mt-1 font-bold">{money(data.alertas.origem_desconhecida)}</p></div>}
            {data.alertas.fiado_sem_origem !== 0 && <div className="rounded-lg border border-amber-200 bg-white/70 p-3 dark:bg-slate-950/40"><p className="text-muted-foreground">Baixas de fiado sem origem</p><p className="mt-1 font-bold">{money(data.alertas.fiado_sem_origem)}</p></div>}
            {data.alertas.lojas_sem_regra.map((item) => <div key={item.loja_id} className="rounded-lg border border-amber-200 bg-white/70 p-3 dark:bg-slate-950/40"><p className="font-medium">{item.loja_nome}</p><p className="text-xs text-muted-foreground">Sem regra ativa · {money(item.valor_registrado)}</p></div>)}
            {data.alertas.diferenca_conciliacao !== 0 && <div className="rounded-lg border border-red-200 bg-white/70 p-3 dark:bg-slate-950/40"><p className="text-muted-foreground">Diferença de conciliação</p><p className="mt-1 font-bold text-red-600">{money(data.alertas.diferenca_conciliacao)}</p></div>}
          </CardContent>
        </Card>
      )}

      <p className="text-right text-xs text-muted-foreground">
        Atualizado em {formatBrasiliaDate(data.gerado_em, { dateStyle: "short", timeStyle: "short" })} · Regra de split consultada em tempo real.
      </p>
    </div>
  );
}
