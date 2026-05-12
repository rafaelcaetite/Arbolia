import { useState } from 'react';
import { X, Trees, MapPin, Ruler, Activity, Calendar, Building2, ChevronLeft, ChevronRight, ImageIcon, History } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

export function TreeDetailsModal() {
  const { isTreeDetailsModalOpen, viewingTreeDetailsId, trees, clients, services, closeTreeDetailsModal, openHistoryModal } = useAppStore();

  const [photoIdx, setPhotoIdx] = useState(0);
  
  if (!isTreeDetailsModalOpen || !viewingTreeDetailsId) return null;

  const tree = trees.find(t => t.id === viewingTreeDetailsId);
  if (!tree) return null;

  const client = clients.find(c => c.id === tree.cliente_id);

  // Fotos desta árvore (apenas os anexos específicos dela via attachmentsByTree)
  const treePhotos = services
    .filter(s => s.treeIds.includes(tree.id) && s.attachmentsByTree?.[tree.id]?.length)
    .flatMap(s => (s.attachmentsByTree![tree.id]).filter(a => a.type === 'image'))
    .slice(-3)
    .reverse();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={closeTreeDetailsModal}></div>
      
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-md relative z-10 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl">
              <Trees size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{tree.especie}</h2>
              <span className="text-[10px] text-slate-400 font-mono">ID: {tree.id}</span>
            </div>
          </div>
          <button onClick={closeTreeDetailsModal} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/30 overflow-y-auto flex flex-col gap-4">
          {client && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={12} /> Cliente Proprietário</span>
              <span className="font-bold text-slate-700 text-sm">{client.nome}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Ruler size={12} /> Altura</span>
              <span className="font-bold text-slate-700 text-sm">{tree.altura}m</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Ruler size={12} /> Copa</span>
              <span className="font-bold text-slate-700 text-sm">{tree.tamanho_copa}m</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} /> Localização GPS</span>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
              <div className="flex flex-col"><span className="text-slate-400 text-[10px] font-sans">Lat:</span> {tree.latitude}</div>
              <div className="flex flex-col"><span className="text-slate-400 text-[10px] font-sans">Lng:</span> {tree.longitude}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={12} /> Nível de Risco</span>
              <span className={`uppercase font-bold text-[10px] px-2 py-1 rounded-lg w-max mt-1 ${
                tree.status_risco === 'baixo' ? 'bg-emerald-100 text-emerald-700' :
                tree.status_risco === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                tree.status_risco === 'alto' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {tree.status_risco}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Registro</span>
              <span className="font-bold text-slate-700 text-sm mt-1">{new Date(tree.data_cadastro).toLocaleDateString()}</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              closeTreeDetailsModal();
              openHistoryModal(tree.id);
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <History size={18} />
            Ver Histórico de Atendimentos
          </button>


          {/* Carrossel de fotos */}
          {treePhotos.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <ImageIcon size={12} /> Fotos Recentes
              </span>
              <div className="relative">
                <img
                  src={treePhotos[photoIdx].dataUrl}
                  alt={treePhotos[photoIdx].name}
                  className="w-full h-36 object-cover rounded-xl border border-slate-100"
                />
                {treePhotos.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-2">
                    <button
                      onClick={() => setPhotoIdx(p => Math.max(0, p - 1))}
                      disabled={photoIdx === 0}
                      className="p-1 bg-white/80 rounded-full shadow text-slate-600 disabled:opacity-30 hover:bg-white transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setPhotoIdx(p => Math.min(treePhotos.length - 1, p + 1))}
                      disabled={photoIdx === treePhotos.length - 1}
                      className="p-1 bg-white/80 rounded-full shadow text-slate-600 disabled:opacity-30 hover:bg-white transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
                {treePhotos.length > 1 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {treePhotos.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === photoIdx ? 'bg-primary' : 'bg-slate-300'
                        }`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
