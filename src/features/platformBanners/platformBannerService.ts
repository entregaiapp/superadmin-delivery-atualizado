import { api } from '../../lib/api';

export type PlatformBannerTargetType = 'loja' | 'rota_loja' | 'produto' | 'link_externo';

export interface PlatformBanner {
  id: string;
  titulo: string;
  subtitulo?: string | null;
  cta_text?: string | null;
  imagem_url: string;
  imagem_path?: string | null;
  destino_tipo: PlatformBannerTargetType;
  destino_loja_id?: string | null;
  destino_rota?: 'home' | 'categories' | 'produtos' | 'promocoes' | 'favorites' | null;
  destino_produto_loja_id?: string | null;
  destino_url?: string | null;
  ativo: boolean;
  prioridade: number;
  inicia_em?: string | null;
  expira_em?: string | null;
}

export type PlatformBannerPayload = Omit<PlatformBanner, 'id'>;

const unwrap = <T,>(response: { data: { data?: T } }) => response.data.data as T;

export const platformBannerService = {
  list: async () => unwrap<PlatformBanner[]>(await api.get('/platform-banners')),
  create: async (payload: PlatformBannerPayload) => unwrap<PlatformBanner>(await api.post('/platform-banners', payload)),
  update: async (id: string, payload: Partial<PlatformBannerPayload>) => unwrap<PlatformBanner>(await api.patch(`/platform-banners/${id}`, payload)),
  remove: async (id: string) => api.delete(`/platform-banners/${id}`),
  upload: async (file: File) => {
    const body = new FormData();
    body.append('image', file);
    return unwrap<{ path: string; url: string }>(await api.post('/platform-banners/upload', body));
  },
};
