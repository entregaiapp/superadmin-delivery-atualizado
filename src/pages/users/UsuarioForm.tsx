import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuarioService, PERFIS_OPTIONS, STATUS_OPTIONS } from "../../features/usuarios/usuarioService";
import { storeService, type Store } from "../../features/stores/storeService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";

const createSchema = z.object({
  loja_id: z.string().uuid("Selecione uma loja válida"),
  nome: z.string().min(2, "Nome é obrigatório (mín. 2 caracteres)"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional().or(z.literal("")),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  perfil: z.enum(["administrador", "operador", "separador", "entregador", "financeiro"]),
  status: z.enum(["ativo", "inativo", "bloqueado"]).default("ativo"),
});

const editSchema = z.object({
  loja_id: z.string().uuid("Selecione uma loja válida"),
  nome: z.string().min(2, "Nome é obrigatório (mín. 2 caracteres)"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional().or(z.literal("")),
  perfil: z.enum(["administrador", "operador", "separador", "entregador", "financeiro"]),
  status: z.enum(["ativo", "inativo", "bloqueado"]).default("ativo"),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type FormValues = CreateFormValues | EditFormValues;

export default function UsuarioForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const requestedPerfil = searchParams.get("perfil");
  const requestedLojaId = searchParams.get("loja_id") || "";
  const returnToStore = searchParams.get("return_to_store");
  const defaultPerfil = PERFIS_OPTIONS.some((option) => option.value === requestedPerfil)
    ? requestedPerfil as FormValues["perfil"]
    : "operador";

  const schema = isEditing ? editSchema : createSchema;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      status: "ativo",
      perfil: defaultPerfil,
      loja_id: requestedLojaId,
    }
  });

  // Carregar lojas para o select
  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: () => storeService.getAll(),
  });

  const stores: Store[] = Array.isArray(storesData?.data?.data)
    ? storesData.data.data
    : Array.isArray(storesData?.data)
      ? storesData.data
      : Array.isArray(storesData)
        ? storesData
        : [];

  // Carregar dados do usuário em modo edição
  const { data: usuario, isLoading } = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => usuarioService.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (usuario && isEditing) {
      reset({
        loja_id: usuario.loja_id || "",
        nome: usuario.nome || "",
        email: usuario.email || "",
        telefone: usuario.telefone || "",
        perfil: usuario.perfil || "operador",
        status: usuario.status || "ativo",
      } as any);
    }
  }, [usuario, reset, isEditing]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: Record<string, any> = { ...data };

      // Limpa campos opcionais vazios
      if (payload.telefone === "") {
        payload.telefone = null;
      }

      if (isEditing) {
        // Não enviar senha na edição
        delete payload.senha;
        return usuarioService.update(id!, payload);
      }
      return usuarioService.create(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      if (returnToStore) {
        navigate(`/stores/${returnToStore}`);
        return;
      }
      navigate("/users");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.response?.data?.message || "Erro ao salvar usuário.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  });

  const onSubmit = (data: FormValues) => {
    setError("");
    mutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados do usuário...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isEditing
                ? "Altere as informações do usuário existente."
                : "Preencha os dados para cadastrar um novo usuário do sistema."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-100/50 rounded-md">
            {error}
          </div>
        )}

        {/* Card 1: Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Informações de identificação do usuário.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                <Input id="nome" placeholder="Ex: João da Silva" {...register("nome")} className={errors.nome ? "border-red-500" : ""} />
                {errors.nome && <span className="text-xs text-red-500">{errors.nome.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" placeholder="joao@exemplo.com" {...register("email")} className={errors.email ? "border-red-500" : ""} />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(00) 00000-0000" {...register("telefone")} />
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha <span className="text-red-500">*</span></Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...register("senha" as any)}
                    className={(errors as any).senha ? "border-red-500" : ""}
                  />
                  {(errors as any).senha && <span className="text-xs text-red-500">{(errors as any).senha.message}</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Vínculo e Permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Vínculo e Permissões</CardTitle>
            <CardDescription>Loja, perfil de acesso e status da conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loja_id">Loja <span className="text-red-500">*</span></Label>
                <select
                  id="loja_id"
                  {...register("loja_id")}
                  className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.loja_id ? "border-red-500" : "border-input"}`}
                >
                  <option value="">Selecione uma loja</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                {errors.loja_id && <span className="text-xs text-red-500">{errors.loja_id.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil <span className="text-red-500">*</span></Label>
                <select
                  id="perfil"
                  {...register("perfil")}
                  className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.perfil ? "border-red-500" : "border-input"}`}
                >
                  {PERFIS_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {errors.perfil && <span className="text-xs text-red-500">{errors.perfil.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-2">
          <Link to="/users">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending ? "Salvando..." : "Salvar Usuário"}
          </Button>
        </div>
      </form>
    </div>
  );
}
