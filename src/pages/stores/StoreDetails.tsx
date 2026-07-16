import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "../../features/stores/storeService";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { ArrowLeft, Edit, Store, Mail, Phone, Hash, Clock, DollarSign, Truck, FileText, Image, Users, UtensilsCrossed, WalletCards, Puzzle, MapPin, KeyRound, Palette, CalendarDays, ClipboardList } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import ContasFinanceirasLoja from "./components/ContasFinanceirasLoja";
import AdminsLoja from "./components/AdminsLoja";
import RelatorioPagamentosEntrega from "./components/RelatorioPagamentosEntrega";
import StoreActivities from "./components/StoreActivities";
import { formatBrasiliaDate } from "../../lib/dateTime";

type StoreTab = "dados" | "usuarios" | "financeiro" | "modulos" | "atividades";
type StoreModuleView = {
  slug: string;
  nome?: string;
  descricao?: string;
  enabled?: boolean;
};
const TENANT_ROOT_DOMAIN = import.meta.env.VITE_TENANT_ROOT_DOMAIN || "entregaiapp.com.br";

export default function StoreDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<StoreTab>("dados");

  const { data: store, isLoading, error } = useQuery({
    queryKey: ["store", id],
    queryFn: () => storeService.getById(id!),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["store-modules", id],
    queryFn: () => storeService.getModules(id!),
    enabled: Boolean(id),
  });

  const { data: storeConfig } = useQuery({
    queryKey: ["store-config", id],
    queryFn: () => storeService.getConfiguration(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando detalhes da loja...</div>;
  }

  if (error || !store) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar detalhes da loja.</div>;
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ativa": return <Badge variant="success">Ativa</Badge>;
      case "inativa": return <Badge variant="secondary">Inativa</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const tabs: Array<{ id: StoreTab; label: string; icon: typeof Store }> = [
    { id: "dados", label: "Dados da loja", icon: Store },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "financeiro", label: "Financeiro", icon: WalletCards },
    { id: "modulos", label: "Módulos", icon: Puzzle },
    { id: "atividades", label: "Atividades", icon: ClipboardList },
  ];

  const deliveryOrderCreationEnabled = storeConfig?.permitir_criacao_pedidos_delivery_admin === true;
  const adminOrderFeeEnabled = storeConfig?.aplicar_taxa_pedidos_admin === true;
  const adminPixEnabled = storeConfig?.pix_pedido_admin_habilitado === true;
  const adminPixExpiration = Number(storeConfig?.pix_pedido_admin_expiracao_minutos) || 30;
  const receiptPinRequired = storeConfig?.exigir_pin_confirmacao_entrega === true;
  const cpfInvoiceEnabled = storeConfig?.permitir_cpf_na_nota_cliente === true;
  const moduleList: StoreModuleView[] = Array.isArray(modules) ? modules : [];
  const formatDate = (value?: string | null) => {
    if (!value) return "Não informado";
    return formatBrasiliaDate(value, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const preferenceBadge = (enabled: boolean, enabledText = "Ativo", disabledText = "Inativo") => (
    <Badge variant={enabled ? "success" : "secondary"}>
      {enabled ? enabledText : disabledText}
    </Badge>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/stores">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Detalhes da Loja
            </h2>
            <p className="text-muted-foreground text-sm">
              Visualize as informações completas deste mercado.
            </p>
          </div>
        </div>
        <Link to={`/stores/${store.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" /> Editar Loja
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dados" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Informações Básicas
              </CardTitle>
              <CardDescription>Identificação e dados principais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome da Loja</p>
                <p className="text-lg font-semibold">{store.nome}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Subdomínio</p>
                <p className="font-mono text-sm">{store.subdomain ? `${store.subdomain}.${TENANT_ROOT_DOMAIN}` : "Não informado"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" /> CNPJ
                  </p>
                  <p>{store.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(store.status)}</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p>{store.razao_social || "Não informado"}</p>
              </div>

              <div className="rounded-md border bg-muted/20 p-3">
                <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <UtensilsCrossed className="h-3 w-3" /> Tipo e cardápio
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {store.tipo_estabelecimento || "mercado"}
                  </Badge>
                  <Badge variant={store.cardapio_configuravel_ativo ? "success" : "secondary"}>
                    Cardápio configurável {store.cardapio_configuravel_ativo ? "habilitado" : "desabilitado"}
                  </Badge>
                  <Badge variant={store.cache_cardapio_ativo ? "success" : "secondary"}>
                    Cache do cardápio {store.cache_cardapio_ativo ? "ativo" : "desativado"}
                  </Badge>
                  <Badge variant={store.permitir_configurar_cpf_na_nota !== false ? "success" : "secondary"}>
                    CPF na nota {store.permitir_configurar_cpf_na_nota !== false ? "configurável" : "bloqueado"}
                  </Badge>
                  <Badge variant={store.visivel_no_app_cliente !== false ? "success" : "secondary"}>
                    App do cliente: {store.visivel_no_app_cliente !== false ? "página principal" : "rota de teste"}
                  </Badge>
                  <Badge variant={store.preco_app_taxa_ativa ? "success" : "secondary"}>
                    Preço do app: {store.preco_app_taxa_ativa ? "taxa ativa" : "sem taxa"}
                  </Badge>
                </div>
              </div>

              {store.descricao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Descrição
                  </p>
                  <p className="text-sm mt-1 bg-slate-50 p-3 rounded-md dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    {store.descricao}
                  </p>
                </div>
              )}

              {store.logo_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Image className="w-3 h-3" /> Logo
                  </p>
                  <img src={store.logo_url} alt="Logo da loja" className="mt-1 h-16 w-16 rounded-md object-cover border" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Canais de comunicação da loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                  <p className="font-medium">{store.email || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone / WhatsApp</p>
                  <p className="font-medium">{store.telefone || "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operação */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Configurações de Operação
              </CardTitle>
              <CardDescription>Horários, taxas e valores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Abertura
                  </p>
                  <p className="text-lg font-semibold">{store.horario_abertura || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Fechamento
                  </p>
                  <p className="text-lg font-semibold">{store.horario_fechamento || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Pedido Mínimo
                  </p>
                  <p className="text-lg font-semibold">
                    R$ {Number(store.valor_minimo_pedido || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Taxa de Entrega
                  </p>
                  <p className="text-lg font-semibold">
                    R$ {Number(store.taxa_entrega_padrao || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-5">
                <div>
                  <p className="text-sm font-semibold">Configurações do tenant</p>
                  <p className="text-xs text-muted-foreground">
                    Permissões operacionais exibidas para o admin da loja.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span>
                      <span className="block text-sm font-medium">Permitir criação manual de pedidos delivery</span>
                      <span className="block text-xs text-muted-foreground">
                        Exibe no painel do tenant o fluxo de pedido por telefone/contato.
                      </span>
                    </span>
                    {preferenceBadge(deliveryOrderCreationEnabled, "Permitido", "Bloqueado")}
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span>
                      <span className="block text-sm font-medium">Aplicar taxa para pedidos no admin</span>
                      <span className="block text-xs text-muted-foreground">
                        Pedidos delivery criados pelo admin usam os preços com taxa do app.
                      </span>
                    </span>
                    {preferenceBadge(adminOrderFeeEnabled, "Aplicada", "Desativada")}
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span>
                      <span className="block text-sm font-medium">Pix por link administrativo</span>
                      <span className="block text-xs text-muted-foreground">
                        QR Code válido por {adminPixExpiration} minutos; link compartilhável válido por sete dias.
                      </span>
                    </span>
                    {preferenceBadge(adminPixEnabled, "Habilitado", "Desabilitado")}
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <KeyRound className="h-3.5 w-3.5" /> Exigir PIN na entrega
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Quando ativo, o PIN é exigido somente em pedidos feitos pelo app do cliente. Pedidos criados pelo admin não exigem PIN.
                      </span>
                    </span>
                    {preferenceBadge(receiptPinRequired, "Exigido", "Não exigido")}
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span>
                      <span className="block text-sm font-medium">Permitir CPF na nota no checkout</span>
                      <span className="block text-xs text-muted-foreground">
                        Configuração do tenant. Só aparece para o admin da loja quando a permissão da plataforma está ativa.
                      </span>
                    </span>
                    {preferenceBadge(cpfInvoiceEnabled, "Permitido", "Bloqueado")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Endereço da loja
              </CardTitle>
              <CardDescription>Usado como endereço de retirada no Mercado Pago.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Logradouro</p>
                <p>{store.endereco_rua || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número</p>
                <p>{store.endereco_numero || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complemento</p>
                <p>{store.endereco_complemento || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bairro</p>
                <p>{store.endereco_bairro || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cidade/UF</p>
                <p>{store.endereco_cidade && store.endereco_estado ? `${store.endereco_cidade}/${store.endereco_estado}` : "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CEP</p>
                <p>{store.endereco_cep || "Não informado"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Identidade visual
              </CardTitle>
              <CardDescription>Cores usadas no app do cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cor primária</p>
                  <p className="font-mono text-sm">{store.cor_primaria || "Não informado"}</p>
                </div>
                <span className="h-9 w-9 rounded-md border" style={{ backgroundColor: store.cor_primaria || "transparent" }} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cor secundária</p>
                  <p className="font-mono text-sm">{store.cor_secundaria || "Não informado"}</p>
                </div>
                <span className="h-9 w-9 rounded-md border" style={{ backgroundColor: store.cor_secundaria || "transparent" }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Cadastro
              </CardTitle>
              <CardDescription>Datas e coordenadas registradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                <p>{formatDate(store.criado_em)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atualizado em</p>
                <p>{formatDate(store.atualizado_em)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                  <p>{store.latitude ?? "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                  <p>{store.longitude ?? "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "usuarios" && (
        <AdminsLoja lojaId={store.id} lojaNome={store.nome} />
      )}

      {activeTab === "financeiro" && (
        <div className="space-y-6">
          <RelatorioPagamentosEntrega lojaId={store.id} />
          <ContasFinanceirasLoja lojaId={store.id} readOnly />
        </div>
      )}

      {activeTab === "modulos" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-primary" />
              Módulos habilitados
            </CardTitle>
            <CardDescription>
              Operações disponíveis para este estabelecimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {moduleList.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum módulo retornado para esta loja.
              </div>
            ) : moduleList.map((module) => (
              <div key={module.slug} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <span>
                  <span className="block text-sm font-semibold">{module.nome}</span>
                  <span className="block text-xs text-muted-foreground">{module.descricao || module.slug}</span>
                </span>
                {preferenceBadge(Boolean(module.enabled), "Habilitado", "Desabilitado")}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "atividades" && (
        <StoreActivities
          storeId={store.id}
          moduleEnabled={moduleList.some((module) => module.slug === "auditoria_operacional" && module.enabled === true)}
        />
      )}
    </div>
  );
}
