import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Eye, RefreshCw, Search, X } from "lucide-react";
import { api } from "../../../lib/api";
import { formatBrasiliaDate } from "../../../lib/dateTime";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";

type Severity = "critica" | "normal";
type AuditChange = { campo: string; rotulo?: string; anterior?: unknown; novo?: unknown };
type AuditEvent = {
  id: string;
  criticidade: Severity;
  categoria: string;
  ator_nome_snapshot: string;
  ator_perfil_snapshot: string;
  entidade_rotulo?: string | null;
  mensagem: string;
  motivo?: string | null;
  ocorrido_em: string;
  alteracoes?: AuditChange[];
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};

export default function StoreActivities({ storeId, moduleEnabled }: { storeId: string; moduleEnabled: boolean }) {
  const [severity, setSeverity] = useState<Severity>("critica");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [search, setSearch] = useState("");
  const [onlyStaff, setOnlyStaff] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [totals, setTotals] = useState({ criticas: 0, normais: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/auditoria-operacional", {
        params: { loja_id: storeId, criticidade: severity, busca: search.trim() || undefined, somente_nao_admin: onlyStaff || undefined, page, per_page: 20 },
      });
      const result = response.data?.data || {};
      setEvents(Array.isArray(result.data) ? result.data : []);
      setPagination({ total: Number(result.total || 0), total_pages: Math.max(1, Number(result.total_pages || 1)) });
      setTotals({ criticas: Number(result.totais?.criticas || 0), normais: Number(result.totais?.normais || 0) });
    } catch (requestError: unknown) {
      setEvents([]);
      const responseData = axios.isAxiosError(requestError) ? requestError.response?.data : undefined;
      setError(responseData?.error?.message || responseData?.message || "Não foi possível carregar as atividades.");
    } finally {
      setLoading(false);
    }
  }, [onlyStaff, page, search, severity, storeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openDetails = async (event: AuditEvent) => {
    setSelected(event);
    try {
      const response = await api.get(`/auditoria-operacional/${event.id}`, { params: { loja_id: storeId } });
      setSelected(response.data?.data || event);
    } catch {
      setError("Não foi possível carregar os detalhes desta atividade.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div><CardTitle>Atividades da loja</CardTitle><CardDescription>Histórico operacional preservado, inclusive quando o módulo estiver desabilitado.</CardDescription></div>
          <Badge variant={moduleEnabled ? "success" : "secondary"}>{moduleEnabled ? "Módulo habilitado" : "Módulo desabilitado"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => { setSeverity("critica"); setPage(1); }} className={`rounded-lg border p-4 text-left ${severity === "critica" ? "border-red-300 bg-red-50" : "hover:bg-muted/30"}`}><span className="flex items-center justify-between font-semibold text-red-800"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Ações críticas</span><strong>{totals.criticas}</strong></span></button>
          <button type="button" onClick={() => { setSeverity("normal"); setPage(1); }} className={`rounded-lg border p-4 text-left ${severity === "normal" ? "border-blue-300 bg-blue-50" : "hover:bg-muted/30"}`}><span className="flex items-center justify-between font-semibold text-blue-800"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Ações normais</span><strong>{totals.normais}</strong></span></button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar pessoa ou atividade" className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm" /></label>
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyStaff} onChange={(event) => { setOnlyStaff(event.target.checked); setPage(1); }} />Somente equipe (usuários que não são Administradores)</label>
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="divide-y overflow-hidden rounded-lg border">
          {loading && events.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Carregando atividades...</div> : events.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma atividade encontrada.</div> : events.map((event) => (
            <div key={event.id} className="flex flex-col gap-3 p-4 hover:bg-muted/20 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant={event.criticidade === "critica" ? "destructive" : "secondary"}>{event.criticidade === "critica" ? "Crítica" : "Normal"}</Badge><span className="text-xs text-muted-foreground">{event.categoria}</span></div><p className="mt-2 text-sm font-medium">{event.mensagem}</p><p className="mt-1 text-xs text-muted-foreground">{event.ator_nome_snapshot} · {event.ator_perfil_snapshot} · {formatBrasiliaDate(event.ocorrido_em, { dateStyle: "short", timeStyle: "short" })}</p></div>
              <Button variant="outline" size="sm" onClick={() => void openDetails(event)}><Eye className="mr-2 h-4 w-4" />Detalhes</Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row"><span className="text-sm text-muted-foreground">Página {page} de {pagination.total_pages} · {pagination.total} atividade(s)</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="h-4 w-4" />Anterior</Button><Button variant="outline" size="sm" disabled={page >= pagination.total_pages || loading} onClick={() => setPage((current) => Math.min(pagination.total_pages, current + 1))}>Próxima<ChevronRight className="h-4 w-4" /></Button></div></div>
      </CardContent>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-auto rounded-xl bg-background p-4 shadow-xl sm:max-h-[90vh] sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Badge variant={selected.criticidade === "critica" ? "destructive" : "secondary"}>{selected.criticidade === "critica" ? "Ação crítica" : "Ação normal"}</Badge><h2 className="mt-3 text-xl font-bold">{selected.mensagem}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.ator_nome_snapshot} · {formatBrasiliaDate(selected.ocorrido_em, { dateStyle: "medium", timeStyle: "medium" })}</p></div><Button className="shrink-0" variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-5 w-5" /></Button></div>{selected.motivo && <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Motivo:</strong> {selected.motivo}</div>}<div className="mt-5"><h3 className="mb-2 font-semibold">O que mudou</h3>{selected.alteracoes?.length ? <div className="divide-y overflow-hidden rounded-lg border">{selected.alteracoes.map((change, index) => <div key={`${change.campo}-${index}`} className="grid grid-cols-1 gap-1 p-3 text-sm sm:grid-cols-3 sm:gap-2"><strong>{change.rotulo || change.campo}</strong><span className="text-muted-foreground">{formatValue(change.anterior)}</span><span>{formatValue(change.novo)}</span></div>)}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sem comparação antes/depois para esta atividade.</p>}</div></div></div>}
    </Card>
  );
}
