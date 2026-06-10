import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from './ServiceCard';
import type { Service, Client, Tree, UserProfile } from '../../store/useAppStore';

interface UpcomingServicesProps {
  formattedDate: string;
  homeServices: Array<Service & { homeGroup?: string; alertStatus?: string }>;
  groupedServices: {
    atrasado: Array<Service & { homeGroup?: string; alertStatus?: string }>;
    hoje: Array<Service & { homeGroup?: string; alertStatus?: string }>;
    amanha: Array<Service & { homeGroup?: string; alertStatus?: string }>;
    esta_semana: Array<Service & { homeGroup?: string; alertStatus?: string }>;
    em_breve: Array<Service & { homeGroup?: string; alertStatus?: string }>;
  };
  clients: Client[];
  trees: Tree[];
  openPostServiceModal?: (id: string) => void;
  openServiceModal?: (id: string) => void;
  onDeleteClick?: (service: Service) => void;
  userProfile?: UserProfile | null;
}

export function UpcomingServices({
  formattedDate,
  homeServices,
  groupedServices,
  clients,
  trees,
  openPostServiceModal,
  openServiceModal,
  onDeleteClick,
  userProfile
}: UpcomingServicesProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="mb-4">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">{formattedDate}</span>
      </div>
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
            {groupedServices.atrasado.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse inline-block" />
                  Atrasados
                </h3>
                {groupedServices.atrasado.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    clients={clients} 
                    trees={trees} 
                    openPostServiceModal={openPostServiceModal} 
                    openServiceModal={openServiceModal} 
                    onDeleteClick={onDeleteClick} 
                    userProfile={userProfile} 
                  />
                ))}
              </div>
            )}

            {groupedServices.hoje.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-1">Hoje</h3>
                {groupedServices.hoje.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    clients={clients} 
                    trees={trees} 
                    openPostServiceModal={openPostServiceModal} 
                    openServiceModal={openServiceModal} 
                    onDeleteClick={onDeleteClick} 
                    userProfile={userProfile} 
                  />
                ))}
              </div>
            )}

            {groupedServices.amanha.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-600 border-b border-slate-100 pb-1">Amanhã</h3>
                {groupedServices.amanha.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    clients={clients} 
                    trees={trees} 
                    openPostServiceModal={openPostServiceModal} 
                    openServiceModal={openServiceModal} 
                    onDeleteClick={onDeleteClick} 
                    userProfile={userProfile} 
                  />
                ))}
              </div>
            )}

            {groupedServices.esta_semana.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 border-b border-slate-100 pb-1">Esta Semana</h3>
                {groupedServices.esta_semana.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    clients={clients} 
                    trees={trees} 
                    openPostServiceModal={openPostServiceModal} 
                    openServiceModal={openServiceModal} 
                    onDeleteClick={onDeleteClick} 
                    userProfile={userProfile} 
                  />
                ))}
              </div>
            )}

            {groupedServices.em_breve.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 border-b border-slate-100 pb-1">Em Breve</h3>
                {groupedServices.em_breve.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    clients={clients} 
                    trees={trees} 
                    openPostServiceModal={openPostServiceModal} 
                    openServiceModal={openServiceModal} 
                    onDeleteClick={onDeleteClick} 
                    userProfile={userProfile} 
                  />
                ))}
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
  );
}
