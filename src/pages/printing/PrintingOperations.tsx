import { useQuery } from "@tanstack/react-query";
import { Printer, RefreshCw } from "lucide-react";
import { printingService } from "../../features/printing/printingService";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

function formatDate(value?: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(row: { revoked_at?: string | null; active?: boolean | null; online?: boolean; operational_status?: string | null }) {
  if (row.revoked_at || row.operational_status === "revoked") return "Revogado";
  if (row.active === false || row.operational_status === "inactive") return "Inativo";
  if (row.operational_status === "suspended_schedule") return "Fora do horário";
  return row.online ? "Online" : "Offline";
}

function statusVariant(row: { revoked_at?: string | null; active?: boolean | null; online?: boolean; operational_status?: string | null }): "default" | "secondary" {
  if (row.online && row.active !== false && !row.revoked_at) return "default";
  return "secondary";
}

export default function PrintingOperations() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["printing-operational-summary"],
    queryFn: printingService.operationalSummary,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Impressão</h2>
          <p className="text-sm text-slate-500">Visão operacional dos agentes, impressoras e filas por loja.</p>
        </div>
        <Button className="w-full sm:w-auto" variant="outline" onClick={() => void refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="h-5 w-5" />
            Agentes e filas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2">Loja</th>
                    <th className="px-3 py-2">Agente</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Versão</th>
                    <th className="px-3 py-2">Última conexão</th>
                    <th className="px-3 py-2">Próxima abertura</th>
                    <th className="px-3 py-2 text-right">Impressoras</th>
                    <th className="px-3 py-2 text-right">Pendentes</th>
                    <th className="px-3 py-2 text-right">Falhas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={`${row.loja_id}:${row.agent_id || "sem-agente"}`} className="border-b last:border-b-0">
                      <td className="px-3 py-3 font-medium">{row.loja_nome}</td>
                      <td className="px-3 py-3">{row.agent_name || "Sem agente"}</td>
                      <td className="px-3 py-3">
                        <Badge variant={statusVariant(row)}>
                          {statusLabel(row)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">{row.app_version || "-"}</td>
                      <td className="px-3 py-3">{formatDate(row.last_seen_at)}</td>
                      <td className="px-3 py-3">{formatDate(row.next_open_at)}</td>
                      <td className="px-3 py-3 text-right">{row.printers}</td>
                      <td className="px-3 py-3 text-right">{row.pending_jobs}</td>
                      <td className="px-3 py-3 text-right font-semibold text-red-600">{row.failed_jobs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
