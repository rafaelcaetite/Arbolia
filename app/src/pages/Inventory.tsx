import { useState } from 'react';
import { InteractiveMap } from '../components/inventory/InteractiveMap';
import { TreeList } from '../components/inventory/TreeList';
import { TreeModal } from '../components/inventory/TreeModal';
import { ServiceModal } from '../components/inventory/ServiceModal';
import { TreeHistoryModal } from '../components/inventory/TreeHistoryModal';
import { TreeDetailsModal } from '../components/inventory/TreeDetailsModal';
import { useAppStore } from '../store/useAppStore';
import { Plus, Map as MapIcon, List as ListIcon } from 'lucide-react';

export function Inventory() {
  const { openEditModal, openServiceModal, selectedTreeIds } = useAppStore();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const hasSelection = selectedTreeIds.length > 0;

  return (
    <div className="h-[calc(100vh-140px)] md:h-full flex gap-0 lg:gap-6 relative">
      <TreeModal />
      <ServiceModal />
      <TreeHistoryModal />
      <TreeDetailsModal />
      
      {/* Lista (Esquerda) */}
      <div className={`w-full lg:w-[450px] h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 flex-col z-10 relative ${viewMode === 'list' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-lg font-bold text-slate-800">Inventário</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => openEditModal(null)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-primary text-slate-600 hover:text-primary px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Nova Árvore</span><span className="sm:hidden">Árvore</span>
            </button>
            <button 
              onClick={() => openServiceModal()}
              disabled={!hasSelection}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                hasSelection 
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/30 hover:scale-[1.02] active:scale-95 cursor-pointer' 
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Plus size={16} /> <span className="hidden sm:inline">{selectedTreeIds.length > 1 ? 'Novo Serviço em Massa' : 'Novo Serviço'}</span><span className="sm:hidden">Serviço</span> {hasSelection && `(${selectedTreeIds.length})`}
            </button>
          </div>
        </div>
        <TreeList />
      </div>
      
      {/* Mapa (Direita) */}
      <div className={`flex-1 w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-2 relative overflow-hidden flex-col ${viewMode === 'map' ? 'flex' : 'hidden lg:flex'}`}>
        <InteractiveMap />
      </div>

      {/* Mobile Floating Toggle */}
      <div className="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[40] bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full flex items-center gap-1 shadow-2xl border border-slate-700/50">
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            viewMode === 'map' 
              ? 'bg-white text-slate-900 shadow-md scale-105' 
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <MapIcon size={16} />
          Mapa
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            viewMode === 'list' 
              ? 'bg-white text-slate-900 shadow-md scale-105' 
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ListIcon size={16} />
          Lista
        </button>
      </div>
    </div>
  );
}
