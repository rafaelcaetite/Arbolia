import { useEffect } from 'react';
import { InteractiveMap } from '../components/inventory/InteractiveMap';
import { TreeList } from '../components/inventory/TreeList';
import { TreeModal } from '../components/inventory/TreeModal';
import { ServiceModal } from '../components/inventory/ServiceModal';
import { TreeHistoryModal } from '../components/inventory/TreeHistoryModal';
import { TreeDetailsModal } from '../components/inventory/TreeDetailsModal';
import { useAppStore, type Tree, type Service } from '../store/useAppStore';
import { Plus } from 'lucide-react';

const MOCK_TREES: Tree[] = [
  { id: 'mock-1', cliente_id: 'client-1', especie: 'Ipê Amarelo', altura: 8.5, tamanho_copa: 4.2, latitude: -20.7546, longitude: -42.8825, status_risco: 'baixo', data_cadastro: new Date().toISOString() },
  { id: 'mock-2', cliente_id: 'client-2', especie: 'Ficus Benjamina', altura: 12.0, tamanho_copa: 8.0, latitude: -20.7586, longitude: -42.8800, status_risco: 'alto', data_cadastro: new Date().toISOString() },
  { id: 'mock-3', cliente_id: 'client-1', especie: 'Pau-Brasil', altura: 6.0, tamanho_copa: 3.5, latitude: -20.7526, longitude: -42.8850, status_risco: 'medio', data_cadastro: new Date().toISOString() }
];

const MOCK_SERVICES: Service[] = [
  { id: 'svc-1', treeIds: ['mock-1', 'mock-2'], tipo: 'Avaliação', data: '2026-05-01', responsavel: 'Rafael', status: 'concluido' },
  { id: 'svc-2', treeIds: ['mock-2'], tipo: 'Poda', data: '2026-05-15', horario: '08:30', responsavel: 'Equipe Alpha', status: 'agendado' },
  { id: 'svc-3', treeIds: ['mock-3'], tipo: 'Supressão', data: new Date().toISOString().split('T')[0], horario: '14:00', responsavel: 'Equipe Beta', status: 'agendado' }
];

export function Inventory() {
  const { trees, setTrees, setServices, openEditModal, openServiceModal, selectedTreeIds } = useAppStore();

  useEffect(() => {
    if (trees.length === 0) {
      setTrees(MOCK_TREES);
      setServices(MOCK_SERVICES);
    }
  }, []);

  const hasSelection = selectedTreeIds.length > 0;

  return (
    <div className="h-full flex gap-6 relative">
      <TreeModal />
      <ServiceModal />
      <TreeHistoryModal />
      <TreeDetailsModal />
      
      {/* Lista (Esquerda) */}
      <div className="w-[450px] h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col z-10 relative">
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-lg font-bold text-slate-800">Inventário</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => openEditModal(null)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-primary text-slate-600 hover:text-primary px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Plus size={16} /> Nova Árvore
            </button>
            <button 
              onClick={openServiceModal}
              disabled={!hasSelection}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                hasSelection 
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/30 hover:scale-[1.02] active:scale-95 cursor-pointer' 
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Plus size={16} /> Novo Serviço {hasSelection && `(${selectedTreeIds.length})`}
            </button>
          </div>
        </div>
        <TreeList />
      </div>
      
      {/* Mapa (Direita) */}
      <div className="flex-1 h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-2 relative overflow-hidden flex flex-col">
        <InteractiveMap />
      </div>
    </div>
  );
}
