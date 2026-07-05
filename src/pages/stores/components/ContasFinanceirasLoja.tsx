import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, User, Landmark, Wallet, MoreVertical, Edit, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { contaFinanceiraService, type ContaFinanceira, type ContaFinanceiraInput } from "../../../features/contasFinanceiras/contaFinanceiraService";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

const contaSchema = z.object({
  nome: z.string().min(2, "Nome da conta é obrigatório"),
  titular: z.string().min(3, "Nome do titular é obrigatório"),
  tipo_titular: z.enum(["empresa", "pessoa"]),
  cpf_cnpj_titular: z.string().min(11, "CPF/CNPJ inválido"),
  banco_nome: z.string().optional(),
  banco_codigo: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  digito: z.string().optional(),
  tipo_conta: z.enum(["corrente", "poupanca", "pagamento"]).optional().or(z.literal("")),
  chave_pix: z.string().optional(),
  gateway: z.enum(["mercadopago", "pagarme", "nubank", "banco_manual", "outro"]).optional().or(z.literal("")),
  conta_gateway_id: z.string().optional(),
  principal: z.boolean(),
  ativa: z.boolean(),
});

type ContaFormValues = z.infer<typeof contaSchema>;

export default function ContasFinanceirasLoja({
  lojaId,
  readOnly = false,
}: {
  lojaId: string;
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContaId, setEditingContaId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["contas_financeiras", lojaId],
    queryFn: () => contaFinanceiraService.getByLojaId(lojaId),
    enabled: !!lojaId,
  });

  const contas: ContaFinanceira[] = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContaFormValues>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      tipo_titular: "empresa",
      tipo_conta: "corrente",
      gateway: "banco_manual",
      principal: false,
      ativa: true,
    },
  });

  const openForm = (conta?: ContaFinanceira) => {
    if (conta) {
      setEditingContaId(conta.id);
      reset({
        nome: conta.nome,
        titular: conta.titular,
        tipo_titular: conta.tipo_titular,
        cpf_cnpj_titular: conta.cpf_cnpj_titular,
        banco_nome: conta.banco_nome || "",
        banco_codigo: conta.banco_codigo || "",
        agencia: conta.agencia || "",
        conta: conta.conta || "",
        digito: conta.digito || "",
        tipo_conta: conta.tipo_conta || "corrente",
        chave_pix: conta.chave_pix || "",
        gateway: conta.gateway || "banco_manual",
        conta_gateway_id: conta.conta_gateway_id || "",
        principal: conta.principal,
        ativa: conta.ativa,
      });
    } else {
      setEditingContaId(null);
      reset({
        nome: "",
        titular: "",
        tipo_titular: "empresa",
        cpf_cnpj_titular: "",
        banco_nome: "",
        banco_codigo: "",
        agencia: "",
        conta: "",
        digito: "",
        tipo_conta: "corrente",
        chave_pix: "",
        gateway: "banco_manual",
        conta_gateway_id: "",
        principal: contas.length === 0, // Primeira conta será a principal
        ativa: true,
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContaId(null);
    reset();
  };

  const saveMutation = useMutation({
    mutationFn: (data: ContaFormValues) => {
      const payload: ContaFinanceiraInput = {
        ...data,
        loja_id: lojaId,
        // limpa vazios
        banco_nome: data.banco_nome || undefined,
        banco_codigo: data.banco_codigo || undefined,
        agencia: data.agencia || undefined,
        conta: data.conta || undefined,
        digito: data.digito || undefined,
        tipo_conta: (data.tipo_conta || undefined) as ContaFinanceiraInput["tipo_conta"],
        chave_pix: data.chave_pix || undefined,
        gateway: (data.gateway || undefined) as ContaFinanceiraInput["gateway"],
        conta_gateway_id: data.conta_gateway_id || undefined,
      };

      if (editingContaId) {
        return contaFinanceiraService.update(editingContaId, payload);
      }
      return contaFinanceiraService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_financeiras", lojaId] });
      closeForm();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      contaFinanceiraService.patch(id, { ativa }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_financeiras", lojaId] });
    },
  });

  const setPrincipalMutation = useMutation({
    mutationFn: (id: string) => contaFinanceiraService.patch(id, { principal: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_financeiras", lojaId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contaFinanceiraService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_financeiras", lojaId] });
    },
  });

  const onSubmit: SubmitHandler<ContaFormValues> = (data) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Contas Financeiras</h3>
          <p className="text-sm text-muted-foreground">
            {readOnly
              ? "Bancos e integrações para onde o saldo desta loja será liquidado ou repassado."
              : "Gerencie os bancos e integrações para onde o saldo desta loja será liquidado ou repassado."}
          </p>
        </div>
        {!readOnly && !isFormOpen && (
          <Button onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Conta
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card className="border-primary/20 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-base">{editingContaId ? "Editar Conta" : "Nova Conta Financeira"}</CardTitle>
              <CardDescription>Insira os dados da conta que receberá os pagamentos desta loja.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Identificador da Conta</Label>
                  <Input {...register("nome")} placeholder="Ex: Mercado Pago - Operação" />
                  {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gateway / Tipo de Conta</Label>
                  <select
                    {...register("gateway")}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="pagarme">Stone (Pagar.me)</option>
                    <option value="nubank">Nubank</option>
                    <option value="banco_manual">Banco Tradicional (Manual)</option>
                    <option value="outro">Outro / Carteira Digital</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Nome do Titular</Label>
                  <Input {...register("titular")} placeholder="Razão Social ou Nome Completo" />
                  {errors.titular && <p className="text-xs text-red-500">{errors.titular.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Titular</Label>
                  <select
                    {...register("tipo_titular")}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="empresa">Pessoa Jurídica (Empresa)</option>
                    <option value="pessoa">Pessoa Física</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>CPF / CNPJ</Label>
                  <Input {...register("cpf_cnpj_titular")} placeholder="Apenas números" />
                  {errors.cpf_cnpj_titular && <p className="text-xs text-red-500">{errors.cpf_cnpj_titular.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border-t pt-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Banco (Opcional)</Label>
                  <Input {...register("banco_nome")} placeholder="Ex: Banco do Brasil" />
                </div>
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input {...register("agencia")} placeholder="Ex: 0001" />
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Input {...register("conta")} placeholder="12345" />
                </div>
                <div className="space-y-2">
                  <Label>Dígito</Label>
                  <Input {...register("digito")} placeholder="6" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Chave PIX (Opcional)</Label>
                  <Input {...register("chave_pix")} placeholder="CNPJ, E-mail, Celular..." />
                </div>
                <div className="space-y-2">
                  <Label>ID no Gateway (Se aplicável)</Label>
                  <Input {...register("conta_gateway_id")} placeholder="Ex: user_123456" />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ativa_conta" {...register("ativa")} className="rounded border-gray-300" />
                  <Label htmlFor="ativa_conta">Conta Ativa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="principal_conta" {...register("principal")} className="rounded border-gray-300" />
                  <Label htmlFor="principal_conta">Conta Principal de Recebimento</Label>
                </div>
              </div>

              {saveMutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                  Erro ao salvar conta financeira. Verifique os dados e tente novamente.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Conta
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {!isFormOpen && (
        isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : contas.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-900 dark:text-slate-100">Nenhuma conta configurada</p>
            <p className="text-sm text-muted-foreground mb-4">
              A loja não possui nenhuma conta de liquidação bancária configurada.
            </p>
            {!readOnly && <Button variant="outline" onClick={() => openForm()}>Criar Primeira Conta</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contas.map(conta => (
              <Card key={conta.id} className={`overflow-hidden transition-all ${conta.principal ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20' : 'border-slate-200'} ${!conta.ativa ? 'opacity-70' : ''}`}>
                <div className="p-5 flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${conta.principal ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    {conta.gateway === 'mercadopago' ? <Wallet className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-base truncate">{conta.nome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {conta.principal && <Badge className="bg-blue-500">Principal</Badge>}
                          {!conta.ativa && <Badge variant="secondary">Inativa</Badge>}
                          <Badge variant="outline" className="capitalize">{conta.gateway || "Banco"}</Badge>
                        </div>
                      </div>
                      {!readOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openForm(conta)}>
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            {!conta.principal && (
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setPrincipalMutation.mutate(conta.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" /> Tornar Principal
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer" onClick={() => toggleStatusMutation.mutate({ id: conta.id, ativa: !conta.ativa })}>
                              {conta.ativa ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                              {conta.ativa ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => {
                              if (window.confirm("Deseja realmente remover esta conta?")) {
                                deleteMutation.mutate(conta.id);
                              }
                            }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        {conta.tipo_titular === 'empresa' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        <span className="truncate">{conta.titular}</span>
                      </div>
                      <div className="truncate">
                        <span className="font-medium mr-1">Doc:</span> {conta.cpf_cnpj_titular}
                      </div>
                      {(conta.agencia || conta.conta) && (
                        <div className="truncate sm:col-span-2">
                          <span className="font-medium mr-1">Ag:</span> {conta.agencia || "-"} 
                          <span className="font-medium ml-2 mr-1">Cc:</span> {conta.conta || "-"}
                          {conta.digito && `-${conta.digito}`}
                        </div>
                      )}
                      {conta.chave_pix && (
                        <div className="truncate sm:col-span-2">
                          <span className="font-medium mr-1">PIX:</span> {conta.chave_pix}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
