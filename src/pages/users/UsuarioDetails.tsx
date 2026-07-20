import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usuarioService, PERFIS_OPTIONS } from "../../features/usuarios/usuarioService";
import { storeService, type Store } from "../../features/stores/storeService";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { ArrowLeft, Edit, Eye, User, Mail, Phone, Shield, Store as StoreIcon, Clock } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { formatBrasiliaDate } from "../../lib/dateTime";

export default function UsuarioDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: usuario, isLoading, error } = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => usuarioService.getById(id!),
  });

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: () => storeService.getAll(),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando detalhes do usuário...</div>;
  }

  if (error || !usuario) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar detalhes do usuário.</div>;
  }

  const storesArr: Store[] = Array.isArray(storesData?.data?.data)
    ? storesData.data.data
    : Array.isArray(storesData?.data)
      ? storesData.data
      : Array.isArray(storesData)
        ? storesData
        : [];
  const loja = storesArr.find((s: Store) => s.id === usuario.loja_id);
  const lojaNome = loja?.nome || usuario.loja_id;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo": return <Badge variant="success">Ativo</Badge>;
      case "inativo": return <Badge variant="secondary">Inativo</Badge>;
      case "bloqueado": return <Badge variant="destructive">Bloqueado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const perfilLabel = PERFIS_OPTIONS.find(p => p.value === usuario.perfil)?.label || usuario.perfil;

  const formatDate = (d?: string | null) => {
    if (!d) return "Nunca";
    return formatBrasiliaDate(d, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link to="/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight">Detalhes do Usuário</h2>
            <p className="text-muted-foreground text-sm">Informações completas do usuário do sistema.</p>
          </div>
        </div>
        <Link className="sm:shrink-0" to={`/users/${usuario.id}/edit`}>
          <Button className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" /> Editar Usuário
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>Identificação do usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
              <p className="text-lg font-semibold">{usuario.nome}</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                <p className="font-medium">{usuario.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="font-medium">{usuario.telefone || "Não informado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissões e Vínculo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Vínculo e Permissões
            </CardTitle>
            <CardDescription>Perfil de acesso e loja vinculada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <StoreIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Loja</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{lojaNome}</p>
                  {loja?.id && (
                    <Link to={`/stores/${loja.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        Ver loja
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perfil</p>
                <p className="mt-1 font-semibold">{perfilLabel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(usuario.status)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Login</p>
                <p className="font-medium">{formatDate(usuario.ultimo_login_em)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t pt-2 text-sm min-[380px]:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p>{formatDate(usuario.criado_em)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p>{formatDate(usuario.atualizado_em)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
