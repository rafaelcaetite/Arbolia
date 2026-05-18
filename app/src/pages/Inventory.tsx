import { useState } from 'react';
import { InteractiveMap } from '../components/inventory/InteractiveMap';
import { TreeList } from '../components/inventory/TreeList';
import { TreeModal } from '../components/inventory/TreeModal';
import { ServiceModal } from '../components/inventory/ServiceModal';
import { TreeHistoryModal } from '../components/inventory/TreeHistoryModal';
import { TreeDetailsModal } from '../components/inventory/TreeDetailsModal';
import { useAppStore } from '../store/useAppStore';
import { Plus, Map as MapIcon, List as ListIcon, TreePine, CalendarPlus } from 'lucide-react';

export function Inventory() {
  const { openEditModal, openServiceModal, selectedTreeIds } = useAppStore();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const hasSelection = selectedTreeIds.length > 0;

  return (
    // pb-20 on mobile to give room for the floating toggle
    <div className="h-[calc(100dvh-80px)] md:h-full flex gap-0 lg:gap-6 relative pb-16 lg:pb-0">
      <TreeModal />
      <ServiceModal />
      <TreeHistoryModal />
      <TreeDetailsModal />
      
      {/* Lista (Esquerda) — overflow-x-hidden locks horizontal scroll */}
      <div className={`w-full lg:w-[450px] h-full bg-white rounded-2xl shadow-sm border border-slate-100 flex-col z-10 relative overflow-hidden ${viewMode === 'list' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Header da Lista */}
        <div className="flex flex-col gap-3 p-4 md:p-5 border-b border-slate-50 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TreePine size={18} className="text-primary" /> Inventário
            </h2>
            {hasSelection && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {selectedTreeIds.length} selecionada{selectedTreeIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => openEditModal(null)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-primary text-slate-600 hover:text-primary px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus size={15} /> <span className="hidden xs:inline">Nova</span> Árvore
            </button>
            <button 
              onClick={() => openServiceModal()}
              disabled={!hasSelection}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                hasSelection 
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/30' 
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
              }`}
            >
              <CalendarPlus size={15} />
              <span className="truncate">{selectedTreeIds.length > 1 ? 'Serviço em Massa' : 'Novo Serviço'}</span>
              {hasSelection && <span className="font-black shrink-0">({selectedTreeIds.length})</span>}
            </button>
          </div>
        </div>

        {/* Lista — apenas scroll vertical */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <TreeList />
        </div>
      </div>
      
      {/* Mapa (Direita) */}
      <div className={`flex-1 w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-2 relative overflow-hidden flex-col ${viewMode === 'map' ? 'flex' : 'hidden lg:flex'}`}>
        <InteractiveMap />
      </div>

      {/* Mobile Floating Toggle — ícone + label premium */}
      <div className="lg:hidden absolute bottom-2 left-1/2 -translate-x-1/2 z-[40] bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full flex items-center gap-1 shadow-2xl border border-slate-700/30">
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
            viewMode === 'map' 
              ? 'bg-white text-slate-900 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon size={15} />
          Mapa
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
            viewMode === 'list' 
              ? 'bg-white text-slate-900 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListIcon size={15} />
          Lista
        </button>
      </div>
    </div>
  );
}

