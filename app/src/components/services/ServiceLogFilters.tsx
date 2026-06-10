import { Search } from 'lucide-react';

const SERVICE_TYPES = ['Todos', 'Poda', 'Supressão', 'Avaliação', 'Tratamento'];
const STATUS_OPTIONS = ['Todos', 'concluido', 'agendado', 'atrasado'];

interface ServiceLogFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  serviceType: string;
  setServiceType: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateStart: string;
  setDateStart: (value: string) => void;
  dateEnd: string;
  setDateEnd: (value: string) => void;
}

export function ServiceLogFilters({
  searchTerm,
  setSearchTerm,
  serviceType,
  setServiceType,
  statusFilter,
  setStatusFilter,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd
}: ServiceLogFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Busca */}
        <div className="lg:col-span-2 relative">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cliente, técnico ou ID do serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Tipo de Serviço */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Tipo de Serviço</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            {SERVICE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt === 'Todos' ? 'Todos' : opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Filtro de Datas */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Início</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Fim</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
