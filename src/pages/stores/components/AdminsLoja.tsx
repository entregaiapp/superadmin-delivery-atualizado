import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, Plus, ShieldCheck } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { PERFIS_OPTIONS, usuarioService, type Usuario } from "../../../features/usuarios/usuarioService";

interface AdminsLojaProps {
  lojaId: string;
  lojaNome: string;
}

type UsuariosResponse = Usuario[] | {
  data?: Usuario[] | {
    data?: Usuario[];
  };
};

function normalizeUsuarios(data: unknown): Usuario[] {
  const response = data as UsuariosResponse;

  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data) && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ativo":
      return <Badge variant="success">Ativo</Badge>;
    case "inativo":
      return <Badge variant="secondary">Inativo</Badge>;
    case "bloqueado":
      return <Badge variant="destructive">Bloqueado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPerfilLabel(perfil: string) {
  return PERFIS_OPTIONS.find((option) => option.value === perfil)?.label || perfil;
}

export default function AdminsLoja({ lojaId, lojaNome }: AdminsLojaProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["usuarios", lojaId],
    queryFn: () => usuarioService.getAll({ loja_id: lojaId }),
  });

  const usuarios = useMemo(() => normalizeUsuarios(data), [data]);

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Usuários vinculados
          </CardTitle>
          <CardDescription>
            Contas com acesso operacional ou administrativo em {lojaNome}.
          </CardDescription>
        </div>
        <Link to={`/users/new?loja_id=${lojaId}&perfil=administrador&return_to_store=${lojaId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-red-500">
                  Erro ao carregar usuários.
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum usuário vinculado a esta loja.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{usuario.nome}</span>
                      {usuario.telefone && (
                        <span className="block text-xs text-muted-foreground">{usuario.telefone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{getPerfilLabel(usuario.perfil)}</TableCell>
                  <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/users/${usuario.id}`}>
                        <Button variant="ghost" size="icon" title="Visualizar usuário">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/users/${usuario.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Editar usuário">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
