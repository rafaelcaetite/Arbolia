import { useState, useEffect } from 'react';
import { X, Trees, MapPin, Ruler, Activity, Calendar, Building2, ChevronLeft, ChevronRight, ImageIcon, History, Loader2 } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export function TreeDetailsModal() {
  const { isTreeDetailsModalOpen, viewingTreeDetailsId, trees, clients, services, closeTreeDetailsModal, openHistoryModal } = useAppStore();

  const [photoIdx, setPhotoIdx] = useState(0);
  const [signedPhotos, setSignedPhotos] = useState<{url: string, name: string}[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  
  const tree = trees.find(t => t.id === viewingTreeDetailsId);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!tree || !isTreeDetailsModalOpen) return;
      
      setLoadingPhotos(true);
      try {
        const photosToSign: string[] = [];
        
        // 1. Fotos diretas da árvore
        if (tree.fotos && tree.fotos.length > 0) {
          photosToSign.push(...tree.fotos);
        }

        // 2. Fotos de serviços (anexos)
        const servicePhotos = services
          .filter(s => s.treeIds.includes(tree.id))
          .flatMap(s => (s.attachmentsByTree?.[tree.id] || []).filter(a => a.type === 'image'))
          .map(a => a.storagePath)
          .filter((p): p is string => !!p);

        photosToSign.push(...servicePhotos);

        if (photosToSign.length > 0) {
          const { data } = await supabase.storage
            .from('Gallery')
            .createSignedUrls(photosToSign, 3600);

          if (data) {
            setSignedPhotos(data.map((item, idx) => ({
              url: item.signedUrl || '',
              name: `Foto ${idx + 1}`
            })).filter(p => p.url !== ''));
          }
        } else {
          setSignedPhotos([]);
        }
      } catch (err) {
        console.error('Erro ao carregar fotos assinadas:', err);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadPhotos();
    setPhotoIdx(0);
  }, [tree, isTreeDetailsModalOpen, services]);

  if (!isTreeDetailsModalOpen || !viewingTreeDetailsId || !tree) return null;

  const client = clients.find(c => c.id === tree.cliente_id);

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
              <span className="text-[10px] text-slate-400 font-mono">
                {tree.codigo_v6 ? `ARB-${tree.codigo_v6.toString().padStart(3, '0')}` : `ID: ${tree.id.slice(0, 8).toUpperCase()}`}
              </span>

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


          {/* Galeria de fotos assinada */}
          {(signedPhotos.length > 0 || loadingPhotos) && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <ImageIcon size={12} /> Galeria de Campo
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                {loadingPhotos ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 size={24} className="text-primary animate-spin" />
                  </div>
                ) : signedPhotos.length > 0 ? (
                  <>
                    <img
                      src={signedPhotos[photoIdx].url}
                      alt={signedPhotos[photoIdx].name}
                      className="w-full h-full object-cover"
                    />
                    {signedPhotos.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <button
                          onClick={() => setPhotoIdx(p => Math.max(0, p - 1))}
                          disabled={photoIdx === 0}
                          className="p-1.5 bg-white/90 rounded-full shadow-lg text-slate-600 disabled:opacity-30 hover:bg-white transition-all transform active:scale-90"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setPhotoIdx(p => Math.min(signedPhotos.length - 1, p + 1))}
                          disabled={photoIdx === signedPhotos.length - 1}
                          className="p-1.5 bg-white/90 rounded-full shadow-lg text-slate-600 disabled:opacity-30 hover:bg-white transition-all transform active:scale-90"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                    {signedPhotos.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {signedPhotos.map((_, i) => (
                          <button key={i} onClick={() => setPhotoIdx(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i === photoIdx ? 'bg-primary w-4' : 'bg-white/60'
                            }`} />
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
