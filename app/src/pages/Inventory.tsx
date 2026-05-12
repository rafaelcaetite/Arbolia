import { useEffect } from 'react';
import { InteractiveMap } from '../components/inventory/InteractiveMap';
import { TreeList } from '../components/inventory/TreeList';
import { TreeModal } from '../components/inventory/TreeModal';
import { ServiceModal } from '../components/inventory/ServiceModal';
import { TreeHistoryModal } from '../components/inventory/TreeHistoryModal';
import { TreeDetailsModal } from '../components/inventory/TreeDetailsModal';
import { useAppStore, type Tree, type Service } from '../store/useAppStore';
import { Plus } from 'lucide-react';




export function Inventory() {
  const { trees, setTrees, setServices, openEditModal, openServiceModal, selectedTreeIds } = useAppStore();



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
