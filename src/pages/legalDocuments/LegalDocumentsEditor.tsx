import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Save } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  legalDocumentService,
  type LegalDocument,
  type LegalDocumentStatus,
  type SaveLegalDocumentPayload,
} from "../../features/legalDocuments/legalDocumentService";

const DOCUMENT_KEY = "privacy-policy";

const defaultForm: SaveLegalDocumentPayload = {
  title: "Política de Privacidade",
  version: "1.0.0",
  content_markdown: "",
  status: "draft",
};

function formatDate(value?: string | null) {
  if (!value) return "Não publicado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: LegalDocumentStatus) {
  const labels: Record<LegalDocumentStatus, string> = {
    draft: "Rascunho",
    published: "Publicado",
    archived: "Arquivado",
  };
  return labels[status];
}

function getErrorMessage(error: unknown) {
  const apiError = error as { response?: { data?: { error?: { message?: string } | string; message?: string } } };
  const responseError = apiError.response?.data?.error;
  if (typeof responseError === "string") return responseError;
  return responseError?.message || apiError.response?.data?.message || "Não foi possível salvar o documento.";
}

export default function LegalDocumentsEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SaveLegalDocumentPayload>(defaultForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["legal-document", DOCUMENT_KEY],
    queryFn: () => legalDocumentService.get(DOCUMENT_KEY),
  });

  const latest = data?.latest ?? data?.published ?? null;
  const versions = useMemo(() => data?.versions ?? [], [data?.versions]);

  useEffect(() => {
    if (!latest) return;
    setForm({
      title: latest.title,
      version: latest.version,
      content_markdown: latest.content_markdown,
      status: latest.status,
    });
  }, [latest?.id]);

  const saveMutation = useMutation({
    mutationFn: () => legalDocumentService.save(DOCUMENT_KEY, form),
    onSuccess: (document) => {
      setError("");
      setSuccess(document.status === "published" ? "Política publicada para todos os tenants." : "Rascunho salvo.");
      queryClient.invalidateQueries({ queryKey: ["legal-document", DOCUMENT_KEY] });
    },
    onError: (err) => {
      setSuccess("");
      setError(getErrorMessage(err));
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    saveMutation.mutate();
  };

  const loadVersion = (document: LegalDocument) => {
    setForm({
      title: document.title,
      version: document.version,
      content_markdown: document.content_markdown,
      status: document.status,
    });
    setError("");
    setSuccess("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando documento...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Documentos legais</h2>
        <p className="text-muted-foreground text-sm">
          Edite a Política de Privacidade global. O conteúdo publicado aqui é usado por todos os tenants.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Política de Privacidade
            </CardTitle>
            <CardDescription>
              Use Markdown. Ao salvar como publicado, a versão anterior publicada será arquivada automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              {success && <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

              <div className="grid gap-4 md:grid-cols-[1fr_160px_180px]">
                <div className="space-y-1">
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Versão</Label>
                  <Input
                    value={form.version}
                    onChange={(event) => setForm({ ...form, version: event.target.value })}
                    placeholder="Ex: 1.0.1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as LegalDocumentStatus })}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Conteúdo em Markdown</Label>
                <textarea
                  className="min-h-[520px] w-full rounded-md border border-input bg-transparent px-3 py-3 font-mono text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.content_markdown}
                  onChange={(event) => setForm({ ...form, content_markdown: event.target.value })}
                  placeholder="# Política de Privacidade..."
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar documento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versão publicada</CardTitle>
              <CardDescription>Documento que os tenants estão usando agora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data?.published ? (
                <>
                  <p className="font-semibold">{data.published.title}</p>
                  <p>Versão: {data.published.version}</p>
                  <p>Publicado em: {formatDate(data.published.published_at)}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Nenhuma versão publicada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
              <CardDescription>Carregue uma versão para editar ou republicar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.length ? versions.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => loadVersion(document)}
                  className="w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">v{document.version}</span>
                    <span className="text-xs text-muted-foreground">{statusLabel(document.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Atualizado em {formatDate(document.atualizado_em)}</p>
                </button>
              )) : (
                <p className="text-sm text-muted-foreground">Nenhuma versão salva.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
