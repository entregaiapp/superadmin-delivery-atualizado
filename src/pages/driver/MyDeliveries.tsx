import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Package, Clock, ChevronRight, Inbox } from "lucide-react";

export type DriverStop = {
  orderId: string;
  customer: string;
  address: string;
  neighborhood: string;
  phone: string;
  note?: string;
  status: 'Pendente' | 'Entregue' | 'Problema';
  problemReason?: string;
  finishedAt?: string;
};

export type DriverRoute = {
  id: string;
  neighborhoods: string[];
  status: 'Aguardando rota' | 'Rota gerada' | 'Em andamento' | 'Concluída' | 'Com problemas';
  distanceKm?: number;
  durationMin?: number;
  startedAt?: string;
  finishedAt?: string;
  mapsUrl?: string;
  stops: DriverStop[];
};

export const mockDriverRoutes: DriverRoute[] = [
  {
    id: '#1024',
    neighborhoods: ['Centro', 'Irapuá', 'Manguinha'],
    status: 'Aguardando rota',
    stops: [
      { orderId: '#00481', customer: 'Ana Paula Mendes', address: 'Rua das Flores, 142', neighborhood: 'Centro', phone: '(11) 99234-5678', note: 'Portão azul, deixar com porteiro', status: 'Pendente' },
      { orderId: '#00484', customer: 'Marcos Vinicius Santos', address: 'Rua Augusta, 220', neighborhood: 'Centro', phone: '(11) 96543-2109', status: 'Pendente' },
      { orderId: '#00488', customer: 'Diego Ferreira', address: 'Rua Teodoro Sampaio, 800', neighborhood: 'Irapuá', phone: '(11) 92109-8765', status: 'Pendente' },
      { orderId: '#00491', customer: 'Renata Almeida', address: 'Rua das Acácias, 67', neighborhood: 'Irapuá', phone: '(11) 99111-2233', note: 'Casa amarela, ao lado da padaria', status: 'Pendente' },
      { orderId: '#00492', customer: 'Thiago Barbosa', address: 'Rua Maria Antônia, 45', neighborhood: 'Manguinha', phone: '(11) 98222-3344', status: 'Pendente' },
      { orderId: '#00493', customer: 'Isabela Martins', address: 'Rua Galvão Bueno, 312', neighborhood: 'Manguinha', phone: '(11) 97333-4455', status: 'Pendente' },
      { orderId: '#00494', customer: 'Eduardo Nunes', address: 'Rua Harmonia, 820', neighborhood: 'Manguinha', phone: '(11) 96444-5566', status: 'Pendente' },
      { orderId: '#00496', customer: 'Rodrigo Fonseca', address: 'Rua Girassol, 150', neighborhood: 'Centro', phone: '(11) 94666-7788', status: 'Pendente' },
    ],
  },
  {
    id: '#1025',
    neighborhoods: ['Centro'],
    status: 'Rota gerada',
    distanceKm: 7.8,
    durationMin: 32,
    mapsUrl: 'https://www.google.com/maps/dir/?api=1&travelmode=driving',
    stops: [
      { orderId: '#00485', customer: 'Juliana Costa', address: 'Av. Rebouças, 1440', neighborhood: 'Centro', phone: '(11) 95432-1098', status: 'Pendente' },
      { orderId: '#00489', customer: 'Camila Sousa', address: 'Rua Haddock Lobo, 450', neighborhood: 'Centro', phone: '(11) 91098-7654', status: 'Pendente' },
      { orderId: '#00495', customer: 'Beatriz Cunha', address: 'Rua Mourato Coelho, 340', neighborhood: 'Centro', phone: '(11) 95555-6677', note: 'Apto 302', status: 'Pendente' },
      { orderId: '#00497', customer: 'Larissa Teixeira', address: 'Rua Cerqueira César, 80', neighborhood: 'Centro', phone: '(11) 93777-8899', status: 'Pendente' },
      { orderId: '#00499', customer: 'Felipe Andrade', address: 'Rua Frei Caneca, 1100', neighborhood: 'Centro', phone: '(11) 92888-9900', status: 'Pendente' },
    ],
  },
  {
    id: '#1023',
    neighborhoods: ['Vila Madalena'],
    status: 'Concluída',
    distanceKm: 5.4,
    durationMin: 24,
    startedAt: '08:10',
    finishedAt: '09:02',
    mapsUrl: 'https://www.google.com/maps',
    stops: [
      { orderId: '#00470', customer: 'Paulo Henrique', address: 'Rua Aspicuelta, 200', neighborhood: 'Vila Madalena', phone: '(11) 91234-5678', status: 'Entregue', finishedAt: '08:25' },
      { orderId: '#00471', customer: 'Marina Lopes', address: 'Rua Fradique Coutinho, 540', neighborhood: 'Vila Madalena', phone: '(11) 92234-5678', status: 'Entregue', finishedAt: '08:42' },
      { orderId: '#00472', customer: 'Gustavo Reis', address: 'Rua Wisard, 88', neighborhood: 'Vila Madalena', phone: '(11) 93234-5678', status: 'Problema', problemReason: 'Cliente ausente', finishedAt: '09:00' },
    ],
  },
];

const statusStyles: Record<string, string> = {
  'Aguardando rota': 'bg-amber-100 text-amber-800',
  'Rota gerada': 'bg-blue-100 text-blue-800',
  'Em andamento': 'bg-indigo-100 text-indigo-800',
  'Concluída': 'bg-green-100 text-green-800',
  'Com problemas': 'bg-red-100 text-red-800',
};

export default function MyDeliveries() {
  const [routes] = useState<DriverRoute[]>(mockDriverRoutes);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 font-display">Minhas Entregas</h1>
        <span className="text-xs text-slate-500 font-medium">
          {routes.length} rotas atribuídas
        </span>
      </div>

      {routes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-800">Nenhuma entrega atribuída</h3>
            <p className="text-sm text-slate-500 max-w-[200px]">
              Quando o mercado atribuir uma entrega para você, ela aparecerá aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {routes.map((route) => {
            const doneCount = route.stops.filter(s => s.status === 'Entregue').length;
            const pendingCount = route.stops.filter(s => s.status === 'Pendente').length;
            
            return (
              <Link
                key={route.id}
                to={`/driver/route/${route.id.replace('#', '')}`}
                className="block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Rota</span>
                      <h2 className="text-lg font-bold text-slate-800 -mt-0.5">Entrega {route.id}</h2>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${statusStyles[route.status]}`}>
                      {route.status}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{route.neighborhoods.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      <span>{route.stops.length} entregas</span>
                      {doneCount > 0 && <span className="text-green-600">· {doneCount} feitas</span>}
                      {pendingCount > 0 && route.status !== 'Aguardando rota' && (
                        <span className="text-amber-600">· {pendingCount} pendentes</span>
                      )}
                    </div>
                    {route.distanceKm && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{route.distanceKm.toLocaleString('pt-BR')} km</span>
                      </div>
                    )}
                    {route.durationMin && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{route.durationMin} min</span>
                      </div>
                    )}
                    {!route.distanceKm && route.status === 'Aguardando rota' && (
                      <span className="text-slate-400 font-normal italic">Distância não calculada</span>
                    )}
                  </div>
                </div>

                <div className="bg-[#122a4c] px-4 py-3 flex items-center justify-between text-white font-semibold text-sm">
                  <span>
                    {route.status === 'Aguardando rota' ? 'Abrir entregas' :
                     route.status === 'Concluída' ? 'Ver resumo' :
                     route.status === 'Com problemas' ? 'Revisar entregas' : 'Continuar rota'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
