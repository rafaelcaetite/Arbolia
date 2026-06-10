import { Trees, Users, AlertTriangle } from 'lucide-react';
import type { Tree, Client, Service } from '../../store/useAppStore';

interface HomeKPIsProps {
  trees: Tree[];
  clients: Client[];
  pendingServices: Service[];
}

export function HomeKPIs({ trees, clients, pendingServices }: HomeKPIsProps) {
  return (
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
  );
}
