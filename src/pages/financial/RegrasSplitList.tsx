import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit } from "lucide-react";
import { regrasSplitService } from "../../features/regras_split/regrasSplitService";
import { Button } from "../../components/ui/button";

export default function RegrasSplitList() {
  const navigate = useNavigate();
  const { data: regras, isLoading, refetch } = useQuery({
    queryKey: ["regras_split"],
    queryFn: regrasSplitService.getAll,
  });

  const regrasList = Array.isArray(regras?.data?.data) 
    ? regras.data.data 
    : (Array.isArray(regras?.data) ? regras.data : (Array.isArray(regras) ? regras : []));

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta regra de cobrança?")) {
      await regrasSplitService.delete(id);
      refetch();
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Regras de cobrança
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie as taxas e comissões da plataforma (Application Fee).
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => navigate("/settings/split-rules/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-4 sm:px-6">Nome da Regra</th>
                <th className="px-3 py-4 sm:px-6">Loja</th>
                <th className="px-3 py-4 sm:px-6">Gateway</th>
                <th className="px-3 py-4 sm:px-6">Status</th>
                <th className="px-3 py-4 text-right sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {regrasList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma regra de cobrança configurada.
                  </td>
                </tr>
              )}
              {regrasList.map((regra: any) => (
                <tr key={regra.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-3 py-4 sm:px-6">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {regra.nome}
                    </div>
                    {regra.descricao && (
                      <div className="text-xs text-slate-500 mt-1">{regra.descricao}</div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                    {regra.loja_nome}
                  </td>
                  <td className="px-3 py-4 sm:px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                      {regra.gateway}
                    </span>
                  </td>
                  <td className="px-3 py-4 sm:px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        regra.ativo
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {regra.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/settings/split-rules/${regra.id}/edit`)}>
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(regra.id!)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
