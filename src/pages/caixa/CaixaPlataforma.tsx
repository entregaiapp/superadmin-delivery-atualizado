import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Ban, DollarSign, Loader2, Plus, Save, Wallet } from "lucide-react";
import { caixaPlataformaService, type CaixaPlataformaEntry, type CaixaPlataformaPayload } from "../../features/caixa/caixaPlataformaService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { dateInputInBrasilia } from "../../lib/dateTime";

function fmt(v: number | string | undefined | null) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const emptyForm: CaixaPlataformaPayload = {
  descricao: "",
  categoria: "",
  tipo: "custo",
  valor: 0,
  competencia: "",
  vencimento_em: "",
  pago_em: null,
  status: "previsto",
  observacoes: "",
};

export default function CaixaPlataforma() {
  const queryClient = useQueryClient();
  const today = dateInputInBrasilia();
  const firstDay = `${today.slice(0, 7)}-01`;
  const [filters, setFilters] = useState({ dataInicio: firstDay, dataFim: today, status: "", categoria: "", tipo: "" });
  const [form, setForm] = useState<CaixaPlataformaPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const queryParams = useMemo(() => ({
    dataInicio: filters.dataInicio || undefined,
    dataFim: filters.dataFim || undefined,
    status: filters.status || undefined,
    categoria: filters.categoria || undefined,
    tipo: filters.tipo || undefined,
  }), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["caixa-plataforma", queryParams],
    queryFn: () => caixaPlataformaService.getAll(queryParams),
  });

  const entries: CaixaPlataformaEntry[] = Array.isArray(data?.data) ? data.data : [];
  const resumo = data?.resumo || {};

  const saveMutation = useMutation({
    mutationFn: (payload: CaixaPlataformaPayload) => {
      const normalized = {
        ...payload,
        valor: Number(payload.valor),
        competencia: payload.competencia || null,
        vencimento_em: payload.vencimento_em || null,
        pago_em: payload.pago_em || null,
        observacoes: payload.observacoes || null,
      };
      return editingId ? caixaPlataformaService.update(editingId, normalized) : caixaPlataformaService.create(normalized);
    },
    onSuccess: () => {
      setForm(emptyForm);
      setEditingId(null);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["caixa-plataforma"] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || err.response?.data?.error || "Erro ao salvar lançamento.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => caixaPlataformaService.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caixa-plataforma"] }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    saveMutation.mutate(form);
  };

  const edit = (entry: CaixaPlataformaEntry) => {
    setEditingId(entry.id);
    setForm({
      descricao: entry.descricao,
      categoria: entry.categoria,
      tipo: entry.tipo,
      valor: Number(entry.valor),
      competencia: entry.competencia?.slice(0, 10) || "",
      vencimento_em: entry.vencimento_em?.slice(0, 10) || "",
      pago_em: entry.pago_em || null,
      status: entry.status,
      observacoes: entry.observacoes || "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Caixa da Plataforma</h2>
        <p className="text-muted-foreground text-sm">Controle custos e receitas gerais do app, separados do caixa das lojas.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Receitas" value={fmt(resumo.total_receitas)} icon={ArrowUpRight} color="text-emerald-500" />
        <SummaryCard title="Custos" value={fmt(resumo.total_custos)} icon={ArrowDownRight} color="text-red-500" />
        <SummaryCard title="Saldo Previsto" value={fmt(resumo.saldo_previsto)} icon={Wallet} color="text-indigo-500" />
        <SummaryCard title="Pendentes" value={fmt(resumo.total_pendente)} icon={DollarSign} color="text-amber-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            {editingId ? "Editar lançamento" : "Novo lançamento"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-6">
            {error && <div className="lg:col-span-6 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-1 lg:col-span-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
                <option value="custo">Custo</option>
                <option value="receita">Receita</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Valor</Label>
              <Input type="number" min="0.01" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                <option value="previsto">Previsto</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Competência</Label>
              <Input type="date" value={form.competencia || ""} onChange={(e) => setForm({ ...form, competencia: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Vencimento</Label>
              <Input type="date" value={form.vencimento_em || ""} onChange={(e) => setForm({ ...form, vencimento_em: e.target.value })} />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <Label>Observações</Label>
              <Input value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <Input type="date" value={filters.dataInicio} onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })} />
            <Input type="date" value={filters.dataFim} onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })} />
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Todos status</option>
              <option value="previsto">Previsto</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}>
              <option value="">Todos tipos</option>
              <option value="custo">Custo</option>
              <option value="receita">Receita</option>
            </select>
            <Input placeholder="Categoria" value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })} />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...</TableCell></TableRow>
                ) : entries.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lançamento encontrado.</TableCell></TableRow>
                ) : entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.descricao}</TableCell>
                    <TableCell>{entry.categoria}</TableCell>
                    <TableCell><Badge variant={entry.tipo === "receita" ? "success" : "secondary"}>{entry.tipo}</Badge></TableCell>
                    <TableCell><Badge variant={entry.status === "cancelado" ? "destructive" : "outline"}>{entry.status}</Badge></TableCell>
                    <TableCell>{fmt(entry.valor)}</TableCell>
                    <TableCell>{entry.competencia ? entry.competencia.slice(0, 10).split("-").reverse().join("/") : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => edit(entry)}>Editar</Button>
                      {entry.status !== "cancelado" && (
                        <Button variant="ghost" size="icon" title="Cancelar lançamento" onClick={() => cancelMutation.mutate(entry.id)}>
                          <Ban className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
