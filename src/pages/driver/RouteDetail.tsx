import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Package, Clock, Navigation, 
  Sparkles, RotateCcw, Check, AlertTriangle, 
  Phone, CheckCircle2, Trophy, FileText, X,
  ChevronRight
} from "lucide-react";
import { mockDriverRoutes } from "./MyDeliveries";
import type { DriverRoute, DriverStop } from "./MyDeliveries";

const statusStyles: Record<string, string> = {
  'Aguardando rota': 'bg-amber-100 text-amber-800',
  'Rota gerada': 'bg-blue-100 text-blue-800',
  'Em andamento': 'bg-indigo-100 text-indigo-800',
  'Concluída': 'bg-green-100 text-green-800',
  'Com problemas': 'bg-red-100 text-red-800',
};

const stopStatusStyles: Record<string, string> = {
  'Pendente': 'bg-slate-100 text-slate-700',
  'Entregue': 'bg-green-100 text-green-800',
  'Problema': 'bg-red-100 text-red-800',
};

export default function RouteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [generating, setGenerating] = useState(false);
  const [problemStop, setProblemStop] = useState<DriverStop | null>(null);

  useEffect(() => {
    const found = mockDriverRoutes.find(r => r.id.replace('#', '') === id);
    if (found) {
      setRoute({ ...found });
    }
  }, [id]);

  if (!route) return null;

  const handleGenerateRoute = async () => {
    setGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setRoute(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'Rota gerada',
        distanceKm: 12.4,
        durationMin: 45,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mapsUrl: 'https://www.google.com/maps/dir/?api=1&travelmode=driving'
      };
    });
    setGenerating(false);
  };

  const handleUpdateStatus = (orderId: string, status: 'Entregue' | 'Problema', reason?: string) => {
    setRoute(prev => {
      if (!prev) return null;
      const newStops = prev.stops.map(s => {
        if (s.orderId === orderId) {
          return {
            ...s,
            status,
            problemReason: reason,
            finishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return s;
      });

      const allFinished = newStops.every(s => s.status !== 'Pendente');
      const hasProblem = newStops.some(s => s.status === 'Problema');
      
      let newStatus = prev.status;
      if (allFinished) {
        newStatus = hasProblem ? 'Com problemas' : 'Concluída';
      } else if (prev.status === 'Rota gerada') {
        newStatus = 'Em andamento';
      }

      return {
        ...prev,
        status: newStatus,
        stops: newStops,
        finishedAt: allFinished ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : prev.finishedAt
      };
    });
    setProblemStop(null);
  };

  const allFinished = route.stops.every(s => s.status !== 'Pendente');
  const doneCount = route.stops.filter(s => s.status === 'Entregue').length;
  const problemCount = route.stops.filter(s => s.status === 'Problema').length;
  const pendingCount = route.stops.filter(s => s.status === 'Pendente').length;

  return (
    <div className="pb-32 min-h-full bg-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-30 px-3 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/driver')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Rota</span>
          <h1 className="font-bold text-slate-800 -mt-0.5">Entrega {route.id}</h1>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusStyles[route.status]}`}>
          {route.status}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Resumo Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Entregas</span>
              <p className="text-lg font-bold text-slate-800">{route.stops.length}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Concluídas</span>
              <p className="text-lg font-bold text-green-600">{doneCount}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Pendentes</span>
              <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="truncate">{route.neighborhoods.join(', ')}</span>
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-4">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-slate-300" />
                <span>{route.distanceKm ? `${route.distanceKm} km` : '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                <span>{route.durationMin ? `${route.durationMin} min` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Rota Finalizada */}
        {allFinished && (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-center space-y-2 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-1">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-green-800">Rota finalizada!</h2>
            <p className="text-sm text-green-700">
              {doneCount} entregues · {problemCount} com problema
            </p>
            <div className="text-[11px] text-green-600/70 font-medium">
              Início: {route.startedAt} · Fim: {route.finishedAt}
            </div>
          </div>
        )}

        {/* Gerar Rota Button */}
        {route.status === 'Aguardando rota' && (
          <button 
            onClick={handleGenerateRoute}
            disabled={generating}
            className="w-full bg-[#122a4c] hover:bg-[#1a3b6a] disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gerando rota...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Gerar rota otimizada</span>
              </>
            )}
          </button>
        )}

        {/* Paradas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-700">
              {route.status === 'Aguardando rota' ? 'Pedidos do grupo' : 'Sequência de entregas'}
            </h3>
            {route.status !== 'Aguardando rota' && !allFinished && (
              <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <RotateCcw className="w-3.5 h-3.5" />
                Recalcular
              </button>
            )}
          </div>

          <div className="space-y-4">
            {generating ? (
              // Skeleton loading
              [1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))
            ) : (
              route.stops.map((stop, index) => (
                <div 
                  key={stop.orderId}
                  className={`bg-white rounded-2xl border p-4 shadow-sm space-y-4 transition-all ${
                    stop.status === 'Entregue' ? 'border-green-200 bg-green-50/30 opacity-75' :
                    stop.status === 'Problema' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                      stop.status === 'Entregue' ? 'bg-green-600 text-white' :
                      stop.status === 'Problema' ? 'bg-red-600 text-white' :
                      'bg-[#122a4c] text-white'
                    }`}>
                      {stop.status === 'Entregue' ? <Check className="w-4 h-4" /> :
                       stop.status === 'Problema' ? <AlertTriangle className="w-4 h-4" /> :
                       route.status === 'Aguardando rota' ? <Package className="w-4 h-4" /> : index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 truncate">{stop.customer}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${stopStatusStyles[stop.status]}`}>
                          {stop.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pedido {stop.orderId}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      <span>{stop.address} — {stop.neighborhood}</span>
                    </div>
                    
                    <a href={`tel:${stop.phone}`} className="flex items-center gap-2.5 text-sm text-blue-600 font-semibold w-fit">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{stop.phone}</span>
                    </a>

                    {stop.note && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed">
                        <span className="font-bold uppercase tracking-tighter mr-1">Obs:</span> {stop.note}
                      </div>
                    )}

                    {stop.problemReason && (
                      <div className="p-3 rounded-xl bg-red-100 border border-red-200 text-xs text-red-800 font-semibold">
                        Motivo: {stop.problemReason}
                      </div>
                    )}

                    {stop.status !== 'Pendente' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmado às {stop.finishedAt}
                      </div>
                    )}
                  </div>

                  {stop.status === 'Pendente' && route.status !== 'Aguardando rota' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={() => handleUpdateStatus(stop.orderId, 'Entregue')}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Entregue</span>
                      </button>
                      <button 
                        onClick={() => setProblemStop(stop)}
                        className="border-2 border-red-200 text-red-700 hover:bg-red-50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Problema</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Google Maps Fixed Button */}
      {route.status !== 'Aguardando rota' && !allFinished && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <a 
              href={route.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#122a4c] hover:bg-[#1a3b6a] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
            >
              <Navigation className="w-5 h-5" />
              <span>Ir para o Google Maps</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </a>
          </div>
        </div>
      )}

      {/* Bottom Sheet Problema */}
      {problemStop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Problema na entrega</h3>
              </div>
              <button 
                onClick={() => setProblemStop(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">Selecione o motivo para <span className="text-slate-800 font-bold">{problemStop.customer}</span>:</p>
              
              <div className="grid gap-2">
                {[
                  'Cliente ausente',
                  'Endereço não encontrado',
                  'Cliente recusou',
                  'Produto divergente',
                  'Outro motivo'
                ].map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleUpdateStatus(problemStop.orderId, 'Problema', reason)}
                    className="w-full text-left px-4 py-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 transition-all active:bg-slate-100"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
