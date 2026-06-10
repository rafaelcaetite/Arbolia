import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import type { Service, Client, Tree, UserProfile } from '../../store/useAppStore';

interface ServiceCardProps {
  service: Service & { homeGroup?: string; alertStatus?: string };
  clients: Client[];
  trees: Tree[];
  openPostServiceModal?: (id: string) => void;
  openServiceModal?: (id: string) => void;
  onDeleteClick?: (service: Service) => void;
  userProfile?: UserProfile | null;
}

export function ServiceCard({
  service,
  clients,
  trees,
  openPostServiceModal,
  openServiceModal,
  onDeleteClick,
  userProfile
}: ServiceCardProps) {
  const ownerIds = new Set<string>();
  service.treeIds.forEach((treeId: string) => {
    const tree = trees.find((t: Tree) => t.id === treeId);
    if (tree?.cliente_id) ownerIds.add(tree.cliente_id);
  });
  const owners = [...ownerIds].map(id => clients.find((c: Client) => c.id === id)).filter(Boolean) as Client[];

  const isHojeOrAtrasado = service.homeGroup === 'hoje' || service.homeGroup === 'atrasado';

  return (
    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-800 text-sm">{service.tipo}</h4>
        <div className="flex items-center gap-1.5">
          {(service.status === 'agendado' || service.status === 'atrasado' || !service.status) && openServiceModal && (
            <button
              onClick={(e) => { e.stopPropagation(); openServiceModal(service.id); }}
              title="Editar Agendamento"
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all md:opacity-0 group-hover:opacity-100"
            >
              <Pencil size={13} />
            </button>
          )}
          {userProfile?.role === 'admin' && (service.status === 'agendado' || service.status === 'atrasado' || !service.status) && onDeleteClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteClick(service); }}
              title="Excluir Agendamento"
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all md:opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          )}
          <span className={`w-2.5 h-2.5 rounded-full ${service.alertStatus === 'atrasado' ? 'bg-red-500 shadow-sm shadow-red-500/50 animate-pulse' :
            service.alertStatus === 'semana' ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50' :
              'bg-emerald-500 shadow-sm shadow-emerald-500/50'
            }`}></span>
        </div>
      </div>
      
      {owners.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-3">
          {owners.map((owner: Client) => (
            <span key={owner.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
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
            {new Date(service.data + 'T00:00:00').toLocaleDateString()}{service.horario && ` às ${service.horario.slice(0, 5)}`}
          </div>
        </div>

        {isHojeOrAtrasado && openPostServiceModal && (
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
