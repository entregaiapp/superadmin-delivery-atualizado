import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileText, Loader2, Search } from "lucide-react";
import { storeService, type DeliveryPaymentBillingReport } from "../../../features/stores/storeService";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { dateInputInBrasilia, formatBrasiliaDate } from "../../../lib/dateTime";

type Option = { key: string; label: string };
type ReportFilters = {
  dataInicio: string;
  dataFim: string;
  dateType: "payment" | "order";
  orderSources: string[];
  captureChannels: string[];
  paymentMethods: string[];
  financialStatuses: string[];
};

const sourceOptions: Option[] = [
  { key: "CUSTOMER_APP", label: "App ou link do cliente" },
  { key: "ADMIN", label: "Painel administrativo" },
  { key: "SALON", label: "Salão" },
  { key: "UNKNOWN", label: "Origem desconhecida" },
];
const channelOptions: Option[] = [
  { key: "ONLINE_GATEWAY", label: "Gateway online" },
  { key: "EXTERNAL_OR_OFFLINE", label: "Externo ou offline" },
  { key: "CREDIT_TAB", label: "Fiado" },
];
const methodOptions: Option[] = [
  { key: "PIX", label: "Pix" },
  { key: "CARD", label: "Cartão" },
  { key: "CASH", label: "Dinheiro" },
  { key: "CREDIT_TAB", label: "Fiado" },
];
const statusOptions: Option[] = [
  { key: "RECEIVED", label: "Recebido" },
  { key: "PENDING", label: "Pendente" },
  { key: "REFUNDED", label: "Estornado" },
  { key: "CANCELED", label: "Cancelado" },
  { key: "REJECTED", label: "Rejeitado" },
  { key: "EXPIRED", label: "Expirado" },
  { key: "UNDEFINED", label: "Indefinido" },
];
const optionLabels = new Map(
  [...sourceOptions, ...channelOptions, ...methodOptions, ...statusOptions].map((option) => [option.key, option.label]),
);

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10).split("-").reverse().join("/");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return formatBrasiliaDate(value, {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function labels(values?: string[] | null) {
  return (values || []).map((value) => optionLabels.get(value) || value).join("; ") || "Todas";
}

function buildCsv(report: DeliveryPaymentBillingReport) {
  const platform = report.resumo.taxa_plataforma;
  const rows: unknown[][] = [
    ["Relatório", "Cobrança e auditoria financeira"],
    ["Loja", report.loja.nome],
    ["Período", `${formatDate(report.periodo.data_inicio)} a ${formatDate(report.periodo.data_fim)}`],
    ["Referência", report.periodo.referencia === "order" ? "Data do pedido" : "Data do pagamento"],
    ["Origens", labels(report.filtros?.order_source)],
    ["Canais", labels(report.filtros?.payment_capture_channel)],
    ["Formas", labels(report.filtros?.payment_method)],
    ["Situações", labels(report.filtros?.financial_status)],
    [],
    ["Resumo"],
    ["Valor registrado", report.resumo.valor_bruto_total],
    ["Base elegível", platform?.base_elegivel ?? ""],
    ["Taxa calculada", platform?.taxa_calculada ?? ""],
    ["Taxa estornada", platform?.taxa_estornada ?? ""],
    ["Taxa líquida", platform?.taxa_liquida ?? ""],
    ["Split recebido", platform?.split_recebido ?? ""],
    ["Split pendente", platform?.split_pendente ?? ""],
    ["Valor a cobrar", report.resumo.valor_final_cobranca],
    ["Diferença de conciliação", platform?.diferenca_conciliacao ?? ""],
    [],
    ["Pedido", "Data de referência", "Origem", "Tipo", "Formas", "Canais", "Situações", "Valor selecionado", "Taxa calculada", "Taxa estornada", "Taxa líquida", "Split recebido", "Split pendente", "Valor a cobrar", "Diferença"],
    ...report.pedidos.map((order) => [
      order.numero_pedido || order.id,
      formatDateTime(order.data_referencia || order.realizado_em),
      optionLabels.get(order.order_source || "") || order.origem_relatorio,
      order.fulfillment_type || order.tipo_pedido,
      labels(order.payment_methods),
      labels(order.payment_capture_channels),
      labels(order.financial_statuses),
      order.valor_pagamentos_selecionados ?? order.total,
      order.taxa_calculada ?? order.valor_taxa_calculada,
      order.taxa_estornada ?? 0,
      order.taxa_liquida ?? order.valor_taxa_calculada,
      order.split_recebido ?? 0,
      order.split_pendente ?? 0,
      order.valor_a_cobrar ?? order.valor_cobranca,
      order.diferenca_conciliacao ?? 0,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCsv(report: DeliveryPaymentBillingReport) {
  const blob = new Blob([`\uFEFF${buildCsv(report)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const storeName = report.loja.nome.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
  anchor.href = url;
  anchor.download = `relatorio-financeiro-${storeName}-${report.periodo.data_inicio}-${report.periodo.data_fim}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function CheckboxGroup({ title, options, selected, onChange }: {
  title: string; options: Option[]; selected: string[]; onChange: (values: string[]) => void;
}) {
  const toggle = (key: string) => onChange(selected.includes(key)
    ? selected.filter((value) => value !== key)
    : [...selected, key]);
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{selected.length} de {options.length} selecionado(s)</p>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(options.map((option) => option.key))}>Marcar todos</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>Limpar</Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
            <input type="checkbox" checked={selected.includes(option.key)} onChange={() => toggle(option.key)} className="h-4 w-4 accent-primary" />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

export default function RelatorioPagamentosEntrega({ lojaId }: { lojaId: string }) {
  const today = dateInputInBrasilia();
  const [filters, setFilters] = useState<ReportFilters>({
    dataInicio: `${today.slice(0, 7)}-01`,
    dataFim: today,
    dateType: "payment",
    orderSources: sourceOptions.map((option) => option.key),
    captureChannels: ["EXTERNAL_OR_OFFLINE"],
    paymentMethods: ["PIX", "CARD", "CASH"],
    financialStatuses: ["RECEIVED", "PENDING", "REFUNDED", "UNDEFINED"],
  });
  const invalidRange = filters.dataFim < filters.dataInicio;
  const emptyGroup = [filters.orderSources, filters.captureChannels, filters.paymentMethods, filters.financialStatuses].some((values) => values.length === 0);
  const reportMutation = useMutation({
    mutationFn: () => storeService.getDeliveryPaymentBillingReport(lojaId, filters as Parameters<typeof storeService.getDeliveryPaymentBillingReport>[1]),
  });
  const report = reportMutation.data;
  const platform = report?.resumo.taxa_plataforma;

  const setDimension = (key: "orderSources" | "captureChannels" | "paymentMethods" | "financialStatuses", values: string[]) => {
    setFilters((current) => ({ ...current, [key]: values }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Relatório de cobrança e pagamentos</CardTitle>
        <CardDescription>Usa a mesma conciliação do dashboard financeiro e salva um snapshot auditável para a loja.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1"><Label>Data inicial</Label><Input type="date" value={filters.dataInicio} onChange={(event) => setFilters((current) => ({ ...current, dataInicio: event.target.value }))} /></div>
          <div className="space-y-1"><Label>Data final</Label><Input type="date" value={filters.dataFim} onChange={(event) => setFilters((current) => ({ ...current, dataFim: event.target.value }))} /></div>
          <div className="space-y-1">
            <Label>Referência das datas</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.dateType} onChange={(event) => setFilters((current) => ({ ...current, dateType: event.target.value as "payment" | "order" }))}>
              <option value="payment">Data do pagamento</option><option value="order">Data do pedido</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <CheckboxGroup title="Origens" options={sourceOptions} selected={filters.orderSources} onChange={(values) => setDimension("orderSources", values)} />
          <CheckboxGroup title="Canais de captura" options={channelOptions} selected={filters.captureChannels} onChange={(values) => setDimension("captureChannels", values)} />
          <CheckboxGroup title="Formas de pagamento" options={methodOptions} selected={filters.paymentMethods} onChange={(values) => setDimension("paymentMethods", values)} />
          <CheckboxGroup title="Situações financeiras" options={statusOptions} selected={filters.financialStatuses} onChange={(values) => setDimension("financialStatuses", values)} />
        </div>

        {(invalidRange || emptyGroup) && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">{invalidRange ? "A data final deve ser maior ou igual à data inicial." : "Selecione ao menos uma opção em cada grupo."}</div>}
        {reportMutation.error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">Erro ao gerar o relatório financeiro.</div>}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending || invalidRange || emptyGroup || !filters.dataInicio || !filters.dataFim}>
            {reportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Gerar e salvar
          </Button>
          <Button type="button" variant="outline" disabled={!report} onClick={() => report && downloadCsv(report)}><Download className="mr-2 h-4 w-4" />CSV</Button>
        </div>

        {report && <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{report.periodo.referencia === "order" ? "Data do pedido" : "Data do pagamento"}</Badge>
            <Badge variant="outline">Canais: {labels(report.filtros?.payment_capture_channel)}</Badge>
            <Badge variant="outline">Formas: {labels(report.filtros?.payment_method)}</Badge>
            <Badge variant="outline">Situações: {labels(report.filtros?.financial_status)}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Summary title="Valor a cobrar" value={money(report.resumo.valor_final_cobranca)} />
            <Summary title="Taxa calculada" value={money(platform?.taxa_calculada)} />
            <Summary title="Taxa líquida" value={money(platform?.taxa_liquida)} />
            <Summary title="Taxa estornada" value={money(platform?.taxa_estornada)} />
            <Summary title="Split recebido" value={money(platform?.split_recebido)} />
            <Summary title="Split pendente" value={money(platform?.split_pendente)} />
            <Summary title="Base elegível" value={money(platform?.base_elegivel)} />
            <Summary title="Diferença de conciliação" value={money(platform?.diferenca_conciliacao)} />
          </div>

          <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Pedidos</TableHead><TableHead>Valor selecionado</TableHead><TableHead>Taxa líquida</TableHead><TableHead>Split recebido</TableHead><TableHead>Split pendente</TableHead><TableHead>A cobrar</TableHead></TableRow></TableHeader><TableBody>
            {report.dias.length === 0 ? <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Nenhum item para os filtros selecionados.</TableCell></TableRow> : report.dias.map((day) => <TableRow key={day.data || "sem-data"}><TableCell>{formatDate(day.data)}</TableCell><TableCell>{day.quantidade_pedidos_total}</TableCell><TableCell>{money(day.valor_bruto_total)}</TableCell><TableCell>{money(day.taxa_liquida)}</TableCell><TableCell>{money(day.split_recebido)}</TableCell><TableCell>{money(day.split_pendente)}</TableCell><TableCell className="font-semibold">{money(day.valor_a_receber)}</TableCell></TableRow>)}
          </TableBody></Table></div>

          <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Referência</TableHead><TableHead>Origem</TableHead><TableHead>Formas</TableHead><TableHead>Canais</TableHead><TableHead>Situações</TableHead><TableHead>Valor selecionado</TableHead><TableHead>Taxa líquida</TableHead><TableHead>Split recebido</TableHead><TableHead>Split pendente</TableHead><TableHead>A cobrar</TableHead></TableRow></TableHeader><TableBody>
            {report.pedidos.length === 0 ? <TableRow><TableCell colSpan={11} className="py-6 text-center text-muted-foreground">Nenhum pedido para auditar.</TableCell></TableRow> : report.pedidos.map((order) => <TableRow key={order.id}><TableCell className="font-medium">{order.numero_pedido}</TableCell><TableCell>{formatDateTime(order.data_referencia || order.realizado_em)}</TableCell><TableCell>{optionLabels.get(order.order_source || "") || order.origem_relatorio}</TableCell><TableCell>{labels(order.payment_methods)}</TableCell><TableCell>{labels(order.payment_capture_channels)}</TableCell><TableCell>{labels(order.financial_statuses)}</TableCell><TableCell>{money(order.valor_pagamentos_selecionados ?? order.total)}</TableCell><TableCell>{money(order.taxa_liquida ?? order.valor_taxa_calculada)}</TableCell><TableCell>{money(order.split_recebido)}</TableCell><TableCell>{money(order.split_pendente)}</TableCell><TableCell className="font-semibold">{money(order.valor_a_cobrar ?? order.valor_cobranca)}</TableCell></TableRow>)}
          </TableBody></Table></div>
        </div>}
      </CardContent>
    </Card>
  );
}
