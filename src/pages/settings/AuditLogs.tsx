import { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, Eye, Search, AlertCircle, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBrasiliaDate } from '../../lib/dateTime';

interface AuditLog {
  id: string;
  usuario_id: string;
  usuario_nome?: string;
  tabela_afetada: string;
  registro_id: string;
  acao: 'insercao' | 'atualizacao' | 'exclusao';
  dados_anteriores: any;
  dados_novos: any;
  criado_em: string;
}

const PAGE_SIZE = 20;

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/logs_auditoria', {
        params: { page, per_page: PAGE_SIZE },
      });
      if (response.data?.success) {
        const payloadData = response.data.data;
        if (Array.isArray(payloadData)) {
          setLogs(payloadData);
        } else if (payloadData && Array.isArray(payloadData.data)) {
          // Handles paginated responses
          setLogs(payloadData.data);
          setPagination({
            total: Number(payloadData.total || 0),
            total_pages: Math.max(1, Number(payloadData.total_pages || 1)),
          });
        } else {
          setLogs([]);
        }
      } else {
        setLogs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar os logs de auditoria');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionColor = (acao: string) => {
    switch (acao) {
      case 'insercao': return 'bg-green-100 text-green-800 border-green-200';
      case 'atualizacao': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exclusao': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getActionLabel = (acao: string) => {
    switch (acao) {
      case 'insercao': return 'Criação';
      case 'atualizacao': return 'Atualização';
      case 'exclusao': return 'Exclusão';
      default: return acao;
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const tabela = log.tabela_afetada || '';
    const acao = log.acao || '';
    const id = log.id || '';
    const nome = log.usuario_nome || '';
    
    return tabela.toLowerCase().includes(searchLower) ||
           acao.toLowerCase().includes(searchLower) ||
           id.toLowerCase().includes(searchLower) ||
           nome.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Logs de Auditoria
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registro completo de todas as ações e modificações em todos os tenants do sistema.
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por módulo, ação, responsável ou ID do log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">Carregando logs de auditoria...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum log encontrado</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Sua busca não retornou resultados.' : 'Não há registros de auditoria no sistema.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ação / Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Módulo (Tabela)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Responsável</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit ${getActionColor(log.acao)}`}>
                          {getActionLabel(log.acao)}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatBrasiliaDate(log.criado_em, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 capitalize">
                        {log.tabela_afetada ? log.tabela_afetada.replace(/_/g, ' ') : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5" title="ID do Registro">
                        {log.registro_id ? `${log.registro_id.substring(0, 8)}...` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {log.usuario_nome || 'Sistema'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5" title="ID do Usuário">
                        {log.usuario_id ? `${log.usuario_id.substring(0, 13)}...` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary p-2 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="text-sm text-slate-500">
          Página {page} de {pagination.total_pages} · {pagination.total} log(s)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || page <= 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pagination.total_pages, current + 1))}
            disabled={loading || page >= pagination.total_pages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />

            <div className="relative inline-block w-full max-w-4xl overflow-hidden rounded-2xl bg-white p-4 text-left align-middle shadow-xl transition-all sm:p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Detalhes da Operação
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(selectedLog.acao)}`}>
                      {getActionLabel(selectedLog.acao)}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Log gerado em {formatBrasiliaDate(selectedLog.criado_em, { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-500 focus:outline-none p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="sr-only">Fechar</span>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Módulo</div>
                  <div className="text-sm font-medium text-slate-900 capitalize">{selectedLog.tabela_afetada ? selectedLog.tabela_afetada.replace(/_/g, ' ') : 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ID do Registro</div>
                  <div className="text-sm font-mono text-slate-900 break-all">{selectedLog.registro_id || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ID do Usuário Responsável</div>
                  <div className="text-sm font-mono text-slate-900 break-all">{selectedLog.usuario_id || 'Sistema'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    Dados Anteriores
                  </h4>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-[400px]">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                      {selectedLog.dados_anteriores ? JSON.stringify(selectedLog.dados_anteriores, null, 2) : 'Nenhum dado anterior (Nova Inserção)'}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    Dados Novos
                  </h4>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-[400px]">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
                      {selectedLog.dados_novos ? JSON.stringify(selectedLog.dados_novos, null, 2) : 'Nenhum dado novo (Exclusão)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
