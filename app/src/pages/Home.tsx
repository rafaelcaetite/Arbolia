import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Service } from '../store/useAppStore';
import { ActionModal } from '../components/common/ActionModal';
import { HomeKPIs } from '../components/home/HomeKPIs';
import { WeatherWidget } from '../components/home/WeatherWidget';
import { UpcomingServices } from '../components/home/UpcomingServices';

export function Home() {
  const { trees, clients, services, openPostServiceModal, openServiceModal, userProfile, deleteService } = useAppStore();

  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const getServiceStatus = (dateStr: string, status: string) => {
    if (status === 'concluido') return 'concluido';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const serviceDate = new Date(dateStr + 'T00:00:00');
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
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let homeGroup = 'em_breve';
        if (diffDays < 0) homeGroup = 'atrasado';
        else if (diffDays === 0) homeGroup = 'hoje';
        else if (diffDays === 1) homeGroup = 'amanha';
        else if (diffDays > 1 && diffDays <= 7) homeGroup = 'esta_semana';

        return {
          ...service,
          alertStatus: getServiceStatus(service.data, service.status),
          homeGroup,
          diffDays
        };
      })
      .sort((a, b) => new Date(a.data + 'T00:00:00').getTime() - new Date(b.data + 'T00:00:00').getTime());
  }, [services]);

  const homeServices = pendingServices.slice(0, 10);
  const groupedServices = {
    atrasado: homeServices.filter(s => s.homeGroup === 'atrasado'),
    hoje: homeServices.filter(s => s.homeGroup === 'hoje'),
    amanha: homeServices.filter(s => s.homeGroup === 'amanha'),
    esta_semana: homeServices.filter(s => s.homeGroup === 'esta_semana'),
    em_breve: homeServices.filter(s => s.homeGroup === 'em_breve')
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <HomeKPIs 
        trees={trees} 
        clients={clients} 
        pendingServices={pendingServices} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-none lg:flex-1">
        <WeatherWidget formattedTime={formattedTime} />

        <UpcomingServices
          formattedDate={formattedDate}
          homeServices={homeServices}
          groupedServices={groupedServices}
          clients={clients}
          trees={trees}
          openPostServiceModal={openPostServiceModal}
          openServiceModal={openServiceModal}
          onDeleteClick={setServiceToDelete}
          userProfile={userProfile}
        />
      </div>

      <ActionModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        type="delete"
        title="Confirmar Exclusão"
        description={`Tem certeza de que deseja excluir permanentemente o agendamento de ${serviceToDelete?.tipo} agendado para ${serviceToDelete ? new Date(serviceToDelete.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''}?`}
        confirmLabel="Sim, excluir"
        onConfirm={async () => {
          if (serviceToDelete) {
            await deleteService(serviceToDelete.id);
            setServiceToDelete(null);
          }
        }}
      />
    </div>
  );
}
