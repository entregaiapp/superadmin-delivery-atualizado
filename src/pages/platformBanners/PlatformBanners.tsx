import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { storeService, type Store } from '../../features/stores/storeService';
import { platformBannerService, type PlatformBanner, type PlatformBannerPayload, type PlatformBannerTargetType } from '../../features/platformBanners/platformBannerService';
import { api } from '../../lib/api';

type FormState = {
  titulo: string;
  subtitulo: string;
  cta_text: string;
  imagem_url: string;
  imagem_path: string;
  destino_tipo: PlatformBannerTargetType;
  destino_loja_id: string;
  destino_rota: string;
  destino_produto_loja_id: string;
  destino_url: string;
  ativo: boolean;
  prioridade: string;
  inicia_em: string;
  expira_em: string;
};

const blankForm = (): FormState => ({
  titulo: '', subtitulo: '', cta_text: 'Conhecer', imagem_url: '', imagem_path: '',
  destino_tipo: 'loja', destino_loja_id: '', destino_rota: 'home', destino_produto_loja_id: '', destino_url: '',
  ativo: true, prioridade: '0', inicia_em: '', expira_em: '',
});

const toLocalInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';
const fromBanner = (banner: PlatformBanner): FormState => ({
  titulo: banner.titulo, subtitulo: banner.subtitulo || '', cta_text: banner.cta_text || '', imagem_url: banner.imagem_url,
  imagem_path: banner.imagem_path || '', destino_tipo: banner.destino_tipo, destino_loja_id: banner.destino_loja_id || '',
  destino_rota: banner.destino_rota || 'home', destino_produto_loja_id: banner.destino_produto_loja_id || '',
  destino_url: banner.destino_url || '', ativo: banner.ativo, prioridade: String(banner.prioridade),
  inicia_em: toLocalInput(banner.inicia_em), expira_em: toLocalInput(banner.expira_em),
});

function unwrapList(payload: any): any[] {
  return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.data?.data) ? payload.data.data : [];
}

export default function PlatformBanners() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PlatformBanner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const bannersQuery = useQuery({ queryKey: ['platform-banners'], queryFn: platformBannerService.list });
  const storesQuery = useQuery({ queryKey: ['stores', 'platform-banners'], queryFn: () => storeService.getAll({ status: 'ativa' }) });
  const stores: Store[] = useMemo(() => unwrapList(storesQuery.data), [storesQuery.data]);
  const productsQuery = useQuery({
    queryKey: ['store-products', form.destino_loja_id],
    enabled: form.destino_tipo === 'produto' && Boolean(form.destino_loja_id),
    queryFn: async () => unwrapList((await api.get(`/lojas/${form.destino_loja_id}/produtos`, { params: { per_page: 100, ativo: true } })).data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      let imageUrl = form.imagem_url;
      let imagePath = form.imagem_path;
      if (file) ({ url: imageUrl, path: imagePath } = await platformBannerService.upload(file));
      const payload: PlatformBannerPayload = {
        titulo: form.titulo.trim(), subtitulo: form.subtitulo.trim() || null, cta_text: form.cta_text.trim() || null,
        imagem_url: imageUrl, imagem_path: imagePath || null, destino_tipo: form.destino_tipo,
        destino_loja_id: ['loja', 'rota_loja', 'produto'].includes(form.destino_tipo) ? form.destino_loja_id || null : null,
        destino_rota: form.destino_tipo === 'rota_loja' ? form.destino_rota as PlatformBannerPayload['destino_rota'] : null,
        destino_produto_loja_id: form.destino_tipo === 'produto' ? form.destino_produto_loja_id || null : null,
        destino_url: form.destino_tipo === 'link_externo' ? form.destino_url.trim() || null : null,
        ativo: form.ativo, prioridade: Number(form.prioridade || 0),
        inicia_em: form.inicia_em ? new Date(form.inicia_em).toISOString() : null,
        expira_em: form.expira_em ? new Date(form.expira_em).toISOString() : null,
      };
      return editing ? platformBannerService.update(editing.id, payload) : platformBannerService.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-banners'] }); closeForm(); },
    onError: (reason: any) => setError(reason?.response?.data?.error?.message || reason?.response?.data?.message || reason?.message || 'Não foi possível salvar o banner.'),
  });
  const deleteMutation = useMutation({
    mutationFn: platformBannerService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-banners'] }),
  });

  const openNew = () => { setEditing(null); setForm(blankForm()); setFile(null); setError(null); setIsFormOpen(true); };
  const openEdit = (banner: PlatformBanner) => { setEditing(banner); setForm(fromBanner(banner)); setFile(null); setError(null); setIsFormOpen(true); };
  const closeForm = () => { setEditing(null); setForm(blankForm()); setFile(null); setError(null); setIsFormOpen(false); };
  const formOpen = isFormOpen;
  const storeName = (id?: string | null) => stores.find((store) => store.id === id)?.nome || 'Loja não encontrada';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Banners da plataforma</h2><p className="text-sm text-muted-foreground">Exibidos somente na escolha de lojas. Os banners dos tenants continuam separados.</p></div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo banner</Button>
      </div>

      {formOpen && <Card>
        <CardHeader className="flex-row items-center justify-between"><div><CardTitle>{editing ? 'Editar banner' : 'Novo banner global'}</CardTitle><CardDescription>O destino é configurado por seleções, sem URLs internas digitadas manualmente.</CardDescription></div><Button variant="ghost" size="icon" onClick={closeForm}><X className="h-4 w-4" /></Button></CardHeader>
        <CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
          <label className="grid gap-1.5 text-sm font-medium">Título acessível<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" placeholder="Oferta da semana" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Texto do botão<input value={form.cta_text} onChange={(event) => setForm({ ...form, cta_text: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" /></label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Subtítulo opcional<input value={form.subtitulo} onChange={(event) => setForm({ ...form, subtitulo: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" /></label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Imagem do banner<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block text-sm" />{form.imagem_url && !file && <img src={form.imagem_url} alt="Banner atual" className="mt-1 h-24 w-48 rounded-md object-cover" />}</label>
          <label className="grid gap-1.5 text-sm font-medium">Tipo de destino<select value={form.destino_tipo} onChange={(event) => setForm({ ...form, destino_tipo: event.target.value as PlatformBannerTargetType, destino_loja_id: '', destino_produto_loja_id: '', destino_url: '' })} className="h-10 rounded-md border border-input bg-background px-3"><option value="loja">Abrir loja</option><option value="rota_loja">Abrir tela de uma loja</option><option value="produto">Abrir produto de uma loja</option><option value="link_externo">Abrir link externo</option></select></label>
          {form.destino_tipo !== 'link_externo' ? <label className="grid gap-1.5 text-sm font-medium">Loja de destino<select required value={form.destino_loja_id} onChange={(event) => setForm({ ...form, destino_loja_id: event.target.value, destino_produto_loja_id: '' })} className="h-10 rounded-md border border-input bg-background px-3"><option value="">Selecione</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.nome}</option>)}</select></label> : <label className="grid gap-1.5 text-sm font-medium">URL externa<input required type="url" value={form.destino_url} onChange={(event) => setForm({ ...form, destino_url: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" placeholder="https://..." /></label>}
          {form.destino_tipo === 'rota_loja' && <label className="grid gap-1.5 text-sm font-medium">Tela da loja<select value={form.destino_rota} onChange={(event) => setForm({ ...form, destino_rota: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3"><option value="home">Início</option><option value="categories">Categorias</option><option value="produtos">Produtos</option><option value="promocoes">Promoções</option><option value="favorites">Favoritos</option></select></label>}
          {form.destino_tipo === 'produto' && <label className="grid gap-1.5 text-sm font-medium">Produto{productsQuery.isLoading ? <span className="text-xs text-muted-foreground">Carregando produtos…</span> : <select required disabled={!form.destino_loja_id} value={form.destino_produto_loja_id} onChange={(event) => setForm({ ...form, destino_produto_loja_id: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3"><option value="">Selecione</option>{(productsQuery.data || []).map((product: any) => <option key={product.id} value={product.id}>{product.nome}</option>)}</select>}</label>}
          <label className="grid gap-1.5 text-sm font-medium">Prioridade<input type="number" min="0" value={form.prioridade} onChange={(event) => setForm({ ...form, prioridade: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" /></label>
          <label className="flex items-center gap-2 pt-6 text-sm font-medium"><input type="checkbox" checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} />Banner ativo</label>
          <label className="grid gap-1.5 text-sm font-medium">Inicia em<input type="datetime-local" value={form.inicia_em} onChange={(event) => setForm({ ...form, inicia_em: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Expira em<input type="datetime-local" value={form.expira_em} onChange={(event) => setForm({ ...form, expira_em: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3" /></label>
          {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}<div className="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button><Button disabled={saveMutation.isPending} type="submit">{saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? 'Salvar alterações' : 'Criar banner'}</Button></div>
        </form></CardContent>
      </Card>}

      <Card><CardContent className="p-0"><div className="divide-y">{bannersQuery.isLoading ? <div className="p-6 text-sm text-muted-foreground">Carregando banners…</div> : (bannersQuery.data || []).length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Não há banners globais. Sem banner ativo, nada será exibido no app do cliente.</div> : (bannersQuery.data || []).map((banner) => <div key={banner.id} className="flex flex-wrap items-center gap-4 p-4"><img src={banner.imagem_url} alt="" className="h-16 w-28 rounded-md object-cover bg-muted" /><div className="min-w-[220px] flex-1"><p className="font-semibold">{banner.titulo}</p><p className="text-sm text-muted-foreground">{banner.destino_tipo === 'link_externo' ? banner.destino_url : `${banner.destino_tipo === 'produto' ? 'Produto em' : 'Destino:'} ${storeName(banner.destino_loja_id)}${banner.destino_rota ? ` · ${banner.destino_rota}` : ''}`}</p><p className="mt-1 text-xs text-muted-foreground">Prioridade {banner.prioridade} · {banner.ativo ? 'Ativo' : 'Inativo'}</p></div><Button variant="outline" size="icon" onClick={() => openEdit(banner)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" disabled={deleteMutation.isPending} onClick={() => window.confirm(`Excluir o banner “${banner.titulo}”?`) && deleteMutation.mutate(banner.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>)}</div></CardContent></Card>
    </div>
  );
}
