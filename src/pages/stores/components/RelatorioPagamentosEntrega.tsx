import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileText, Loader2, Search } from "lucide-react";
import {
  storeService,
  type DeliveryPaymentBillingReport,
} from "../../../features/stores/storeService";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { dateInputInBrasilia, formatBrasiliaDate } from "../../../lib/dateTime";

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  if (!value) return "-";
  return value.slice(0, 10).split("-").reverse().join("/");
}

function formatDateTime(value: string) {
  if (!value) return "-";
  return formatBrasiliaDate(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: unknown) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function originLabel(value: string | undefined | null) {
  const labels: Record<string, string> = {
    cliente: "Cliente",
    manual: "Manual",
    fiado: "Fiado",
    salao: "Salao",
  };
  return labels[String(value || "").toLowerCase()] || String(value || "Indefinido");
}

function buildCsv(report: DeliveryPaymentBillingReport) {
  const rows = [
    ["Relatorio", "Pagamentos na entrega"],
    ["Loja", report.loja.nome],
    ["Periodo", `${formatDate(report.periodo.data_inicio)} a ${formatDate(report.periodo.data_fim)}`],
    ["Regra de split", report.regra_split ? `${report.regra_split.tipo_valor} ${report.regra_split.valor}` : "Sem regra ativa"],
    [],
    ["Resumo"],
    ["Pedidos clientes", report.resumo.quantidade_pedidos_clientes],
    ["Pedidos manuais", report.resumo.quantidade_pedidos_manuais],
    ["Pedidos fiado", report.resumo.quantidade_pedidos_fiados || 0],
    ["Pedidos salao", report.resumo.quantidade_pedidos_salao || 0],
    ["Valor bruto total", report.resumo.valor_bruto_total],
    ["Valor final da cobranca", report.resumo.valor_final_cobranca],
    [],
    [
      "Data",
      "Numero",
      "Origem",
      "Categoria",
      "Status",
      "Pagamento",
      "Fiado",
      "Taxa registrada",
      "Total",
      "Valor cobranca",
      "Contabiliza plataforma",
    ],
    ...report.pedidos.map((order) => [
      formatDate(order.data),
      order.numero_pedido,
      originLabel(order.origem_relatorio),
      order.categoria_cobranca_label || order.categoria_cobranca || "",
      order.status,
      order.pagamento_entrega_tipo,
      order.pedido_fiado ? "sim" : "nao",
      order.aplicado_taxa ? "sim" : "nao",
      order.total,
      order.valor_cobranca,
      order.contabiliza_plataforma ? "sim" : "nao",
    ]),
    [],
    ["Valor final da cobranca", report.resumo.valor_final_cobranca],
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCsv(report: DeliveryPaymentBillingReport) {
  const csv = buildCsv(report);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const storeName = report.loja.nome.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
  anchor.href = url;
  anchor.download = `relatorio-pagamentos-entrega-${storeName}-${report.periodo.data_inicio}-${report.periodo.data_fim}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function RelatorioPagamentosEntrega({
  lojaId,
  storeConfig: _storeConfig,
}: {
  lojaId: string;
  storeConfig: any;
}) {
  const today = dateInputInBrasilia();
  const firstDay = `${today.slice(0, 7)}-01`;
  const [filters, setFilters] = useState({ dataInicio: firstDay, dataFim: today });

  const invalidRange = Boolean(filters.dataInicio && filters.dataFim && filters.dataFim < filters.dataInicio);
  const reportMutation = useMutation({
    mutationFn: () => storeService.getDeliveryPaymentBillingReport(lojaId, filters),
  });

  const report = reportMutation.data;
  const splitLabel = useMemo(() => {
    if (!report?.regra_split) return "Sem regra ativa";
    if (report.regra_split.tipo_valor === "percentual") return `${report.regra_split.valor}%`;
    if (report.regra_split.tipo_valor === "fixo") return money(report.regra_split.valor);
    return `${report.regra_split.tipo_valor} ${report.regra_split.valor}`;
  }, [report?.regra_split]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Relatório de pagamentos na entrega
        </CardTitle>
        <CardDescription>
          Cobrança da taxa de plataforma para pedidos pagos presencialmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <div className="space-y-1">
            <Label>Data inicial</Label>
            <Input
              type="date"
              value={filters.dataInicio}
              onChange={(event) => setFilters((current) => ({ ...current, dataInicio: event.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Data final</Label>
            <Input
              type="date"
              value={filters.dataFim}
              onChange={(event) => setFilters((current) => ({ ...current, dataFim: event.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending || !filters.dataInicio || !filters.dataFim || invalidRange}
            >
              {reportMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Gerar e salvar
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              disabled={!report}
              onClick={() => report && downloadCsv(report)}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>

        {reportMutation.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {(reportMutation.error as any)?.response?.data?.error?.message || "Erro ao gerar relatório."}
          </div>
        )}

        {invalidRange && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            A data final deve ser maior ou igual à data inicial.
          </div>
        )}

        {report && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <Summary title="Valor a receber" value={money(report.resumo.valor_final_cobranca)} />
              <Summary title="Pedidos clientes" value={String(report.resumo.quantidade_pedidos_clientes)} />
              <Summary title="Pedidos manuais" value={String(report.resumo.quantidade_pedidos_manuais)} />
              <Summary title="Pedidos fiado" value={String(report.resumo.quantidade_pedidos_fiados || 0)} />
              <Summary title="Valor bruto" value={money(report.resumo.valor_bruto_total)} />
            </div>

            {Array.isArray(report.categorias) && report.categorias.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {report.categorias.map((category) => (
                  <Summary
                    key={category.categoria}
                    title={category.label}
                    value={`${money(category.valor_cobranca)} / ${category.quantidade_cobrada} pedido(s)`}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Regra de split:</span>
              <Badge variant={report.regra_split ? "outline" : "secondary"}>{splitLabel}</Badge>
              <span>Período: {formatDate(report.periodo.data_inicio)} a {formatDate(report.periodo.data_fim)}</span>
              {report.gerado_em && <span>Salvo em: {formatDateTime(report.gerado_em)}</span>}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Clientes</TableHead>
                    <TableHead>Manuais</TableHead>
                    <TableHead>Fiados</TableHead>
                    <TableHead>Salao</TableHead>
                    <TableHead>Valor bruto</TableHead>
                    <TableHead>Valor a receber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.dias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                        Nenhum pedido pago na entrega no período.
                      </TableCell>
                    </TableRow>
                  ) : report.dias.map((day) => (
                    <TableRow key={day.data}>
                      <TableCell className="font-medium">{formatDate(day.data)}</TableCell>
                      <TableCell>{day.quantidade_pedidos_clientes}</TableCell>
                      <TableCell>{day.quantidade_pedidos_manuais}</TableCell>
                      <TableCell>{day.quantidade_pedidos_fiados || 0}</TableCell>
                      <TableCell>{day.quantidade_pedidos_salao || 0}</TableCell>
                      <TableCell>{money(day.valor_bruto_total)}</TableCell>
                      <TableCell className="font-semibold">{money(day.valor_a_receber)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Fiado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Valor a receber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                        Nenhum pedido para detalhar.
                      </TableCell>
                    </TableRow>
                  ) : report.pedidos.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.numero_pedido}</TableCell>
                      <TableCell>{formatDateTime(order.realizado_em)}</TableCell>
                      <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                      <TableCell>{originLabel(order.origem_relatorio)}</TableCell>
                      <TableCell>{order.categoria_cobranca_label || order.categoria_cobranca || "-"}</TableCell>
                      <TableCell className="capitalize">{order.pagamento_entrega_tipo}</TableCell>
                      <TableCell>{order.pedido_fiado ? "Sim" : "Nao"}</TableCell>
                      <TableCell>{money(order.total)}</TableCell>
                      <TableCell className="font-semibold">{money(order.valor_cobranca)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
