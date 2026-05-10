import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trees, Users, AlertTriangle, CloudRain, Clock, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const weatherData = [
  { time: '08:00', temp: 21 },
  { time: '10:00', temp: 23 },
  { time: '12:00', temp: 26 },
  { time: '14:00', temp: 27 },
  { time: '16:00', temp: 25 },
  { time: '18:00', temp: 22 },
];

export function Home() {
  const { trees, clients, services, openPostServiceModal } = useAppStore();
  const navigate = useNavigate();

  // Reutilizando a lógica de status dos Alertas
  const getServiceStatus = (dateStr: string, status: string) => {
    if (status === 'concluido') return 'concluido';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const serviceDate = new Date(dateStr);
    serviceDate.setHours(0, 0, 0, 0);

    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'atrasado';
    if (diffDays <= 7) return 'semana';
    return 'mes';
  };

  const pendingServices = useMemo(() => {
    return services.filter(s => s.status !== 'concluido')
      .map(service => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const serviceDate = new Date(service.data + 'T00:00:00');
        serviceDate.setHours(0, 0, 0, 0);

        const diffTime = serviceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let homeGroup = 'proximos';
        if (diffDays <= 0) homeGroup = 'hoje';
        else if (diffDays === 1) homeGroup = 'amanha';

        return {
          ...service,
          alertStatus: getServiceStatus(service.data, service.status),
          homeGroup,
          diffDays
        };
      })
      .sort((a, b) => new Date(a.data + 'T00:00:00').getTime() - new Date(b.data + 'T00:00:00').getTime());
  }, [services]);

  // Agrupando por categoria (limite total exibido para não estourar a tela: 6)
  const homeServices = pendingServices.slice(0, 6);
  const groupedServices = {
    hoje: homeServices.filter(s => s.homeGroup === 'hoje'),
    amanha: homeServices.filter(s => s.homeGroup === 'amanha'),
    proximos: homeServices.filter(s => s.homeGroup === 'proximos')
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-8">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Trees size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Árvores Cadastradas</p>
            <h3 className="text-2xl font-bold text-slate-800">{trees.length}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Clientes Ativos</p>
            <h3 className="text-2xl font-bold text-slate-800">{clients.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Serviços Pendentes</p>
            <h3 className="text-2xl font-bold text-slate-800">{pendingServices.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Weather Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CloudRain className="text-blue-500" size={20} />
              Previsão do Tempo (Mock)
            </h2>
            <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Hoje</span>
          </div>
          <div className="flex-1 w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weatherData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`${value}°C`, 'Temperatura']}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                  activeDot={{r: 6, strokeWidth: 0}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Services Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-emerald-500" size={20} />
              Agendamentos Próximos
            </h2>
          </div>
          <div className="flex flex-col gap-5 overflow-y-auto pr-2 max-h-[350px]">
            {homeServices.length === 0 ? (
              <div className="text-center text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-sm">Nenhum serviço pendente.</p>
              </div>
            ) : (
              <>
                {groupedServices.hoje.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 border-b border-slate-100 pb-1">Hoje</h3>
                    {groupedServices.hoje.map(service => renderServiceCard(service, clients, trees, openPostServiceModal))}
                  </div>
                )}
                
                {groupedServices.amanha.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 border-b border-slate-100 pb-1">Amanhã</h3>
                    {groupedServices.amanha.map(service => renderServiceCard(service, clients, trees))}
                  </div>
                )}

                {groupedServices.proximos.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-100 pb-1">Próximos</h3>
                    {groupedServices.proximos.map(service => renderServiceCard(service, clients, trees))}
                  </div>
                )}
              </>
            )}
          </div>
          <button 
            onClick={() => navigate('/alertas')}
            className="mt-auto w-full pt-4 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Ver painel de alertas &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper para renderizar o card na Home
function renderServiceCard(service: any, clients: any[], trees: any[], openPostServiceModal?: (id: string) => void) {
  // Busca TODOS os proprietários únicos das árvores vinculadas ao serviço
  const ownerIds = new Set<string>();
  service.treeIds.forEach((treeId: string) => {
    const tree = trees.find((t: any) => t.id === treeId);
    if (tree?.cliente_id) ownerIds.add(tree.cliente_id);
  });
  const owners = [...ownerIds].map(id => clients.find((c: any) => c.id === id)).filter(Boolean);

  const isHoje = service.homeGroup === 'hoje';

  return (
    <div key={service.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-800 text-sm">{service.tipo}</h4>
        {/* Regra Operacional de Cores */}
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
          service.alertStatus === 'atrasado' ? 'bg-red-500 shadow-sm shadow-red-500/50 animate-pulse' :
          service.alertStatus === 'semana' ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50' :
          'bg-emerald-500 shadow-sm shadow-emerald-500/50'
        }`}></span>
      </div>
      {/* Badges de proprietários — todos os donos únicos */}
      {owners.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-3">
          {owners.map((owner: any) => (
            <span key={owner.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {owner.nome}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-3">Sem proprietário vinculado</p>
      )}
      
      <div className="flex justify-between items-end mt-1">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {service.responsavel}
          </div>
          <div className="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm w-fit">
            {new Date(service.data + 'T00:00:00').toLocaleDateString()}{service.horario && ` às ${service.horario}`}
          </div>
        </div>
        
        {isHoje && openPostServiceModal && (
          <button 
            onClick={() => openPostServiceModal(service.id)}
            className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <CheckCircle2 size={14} /> Concluir
          </button>
        )}
      </div>
    </div>
  );
}
