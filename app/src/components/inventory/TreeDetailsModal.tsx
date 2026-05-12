import { useState, useEffect } from 'react';
import { X, Trees, MapPin, Ruler, Activity, Calendar, Building2, ChevronLeft, ChevronRight, ImageIcon, History, Loader2, FileText } from 'lucide-react';

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
        const galleryFiles: {path: string, name: string}[] = [];
        const documentFiles: {path: string, name: string}[] = [];
        
        // 1. Fotos/Arquivos diretas da árvore (sempre Gallery)
        if (tree.fotos && Array.isArray(tree.fotos)) {
          tree.fotos.forEach(f => {
            if (f) galleryFiles.push({ path: f, name: f.split('/').pop() || 'Foto' });
          });
        }

        // 2. Fotos/Arquivos de serviços (anexos)
        services
          .filter(s => s.treeIds.includes(tree.id))
          .forEach(s => {
            const treeAttachments = s.attachmentsByTree?.[tree.id] || [];
            treeAttachments.forEach(a => {
              if (a.storagePath) {
                if (a.type === 'image') galleryFiles.push({ path: a.storagePath, name: a.name });
                else documentFiles.push({ path: a.storagePath, name: a.name });
              }
            });
          });

        const signedResults: {url: string, name: string}[] = [];

        // Sign Gallery Files
        if (galleryFiles.length > 0) {
          // Remove duplicates based on path, keeping the name
          const uniqueGallery = galleryFiles.filter((v, i, a) => a.findIndex(t => t.path === v.path) === i);
          const paths = uniqueGallery.map(g => g.path);
          const { data, error } = await supabase.storage.from('Gallery').createSignedUrls(paths, 3600);
          if (!error && data) {
            data.forEach((item, idx) => {
              if (item.signedUrl) signedResults.push({ url: item.signedUrl, name: uniqueGallery[idx].name });
            });
          }
        }

        // Sign Document Files
        if (documentFiles.length > 0) {
          const uniqueDocs = documentFiles.filter((v, i, a) => a.findIndex(t => t.path === v.path) === i);
          const paths = uniqueDocs.map(d => d.path);
          const { data, error } = await supabase.storage.from('Documents').createSignedUrls(paths, 3600);
          if (!error && data) {
            data.forEach((item, idx) => {
              if (item.signedUrl) signedResults.push({ url: item.signedUrl, name: uniqueDocs[idx].name });
            });
          }
        }

        setSignedPhotos(signedResults);
      } catch (err) {
        console.error('Erro ao carregar arquivos assinados:', err);
        setSignedPhotos([]);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadPhotos();
    setPhotoIdx(0);
  }, [tree, isTreeDetailsModalOpen, services]);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isTreeDetailsModalOpen || !viewingTreeDetailsId || !tree) return null;

  const client = clients.find(c => c.id === tree.cliente_id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={closeTreeDetailsModal}></div>
      
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-md relative z-10 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[95vh]">
        
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-xl">
              <Trees size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight leading-tight">{tree.especie}</h2>
              <span className="text-[9px] text-slate-400 font-mono">
                {tree.codigo_v6 ? `ARB-${tree.codigo_v6.toString().padStart(3, '0')}` : `ID: ${tree.id.slice(0, 8).toUpperCase()}`}
              </span>
            </div>
          </div>
          <button onClick={closeTreeDetailsModal} className="p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 bg-slate-50/30 overflow-y-auto flex flex-col gap-3">
          {client && (
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={10} /> Cliente Proprietário</span>
              <span className="font-bold text-slate-700 text-xs">{client.nome}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Ruler size={10} /> Altura</span>
              <span className="font-bold text-slate-700 text-xs">{tree.altura}m</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Ruler size={10} /> Copa</span>
              <span className="font-bold text-slate-700 text-xs">{tree.tamanho_copa}m</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={10} /> Localização GPS</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
              <div className="flex flex-col"><span className="text-slate-400 text-[9px] font-sans">Lat:</span> {tree.latitude}</div>
              <div className="flex flex-col"><span className="text-slate-400 text-[9px] font-sans">Lng:</span> {tree.longitude}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={10} /> Nível de Risco</span>
              <span className={`uppercase font-bold text-[9px] px-1.5 py-0.5 rounded-lg w-max mt-0.5 ${
                tree.status_risco === 'baixo' ? 'bg-emerald-100 text-emerald-700' :
                tree.status_risco === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                tree.status_risco === 'alto' ? 'bg-orange-100 text-orange-700' :
                tree.status_risco === 'critico' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {tree.status_risco || 'Pendente'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={10} /> Registro</span>
              <span className="font-bold text-slate-700 text-xs mt-0.5">{new Date(tree.data_cadastro).toLocaleDateString()}</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              closeTreeDetailsModal();
              openHistoryModal(tree.id);
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all text-sm"
          >
            <History size={16} />
            Ver Histórico
          </button>

          {/* Galeria de Fotos e Arquivos */}
          {(signedPhotos.length > 0 || loadingPhotos) && (
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <ImageIcon size={10} /> Arquivos e Fotos
              </span>
              <div 
                className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group cursor-pointer" 
                onClick={() => {
                  const current = signedPhotos[photoIdx];
                  if (!current) return;
                  const isImage = current.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/);
                  if (isImage) {
                    setIsLightboxOpen(true);
                  } else {
                    window.open(current.url, '_blank');
                  }
                }}
              >
                {loadingPhotos ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 size={20} className="text-primary animate-spin" />
                  </div>
                ) : signedPhotos.length > 0 ? (
                  <>
                    {signedPhotos[photoIdx].name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/) ? (
                      <img
                        src={signedPhotos[photoIdx].url}
                        alt={signedPhotos[photoIdx].name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : signedPhotos[photoIdx].name.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full relative group/pdf">
                        <iframe
                          src={`${signedPhotos[photoIdx].url}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full h-full border-0 pointer-events-none"
                          title="PDF Preview"
                        />
                        <div className="absolute inset-0 bg-transparent group-hover/pdf:bg-black/10 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-2 border-t border-slate-100 flex items-center gap-2">
                          <FileText size={12} className="text-blue-500" />
                          <span className="text-[10px] font-bold text-slate-600 truncate flex-1">{signedPhotos[photoIdx].name}</span>
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest">Abrir</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                        <FileText size={32} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-500 px-4 text-center truncate w-full">
                          {signedPhotos[photoIdx].name}
                        </span>
                        <span className="text-[9px] text-primary bg-primary/5 px-2 py-1 rounded-full">Clique para abrir</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    
                    {signedPhotos.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setPhotoIdx(p => Math.max(0, p - 1))}
                          disabled={photoIdx === 0}
                          className="p-1 bg-white/90 rounded-full shadow-lg text-slate-600 disabled:opacity-0 hover:bg-white transition-all transform active:scale-90"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() => setPhotoIdx(p => Math.min(signedPhotos.length - 1, p + 1))}
                          disabled={photoIdx === signedPhotos.length - 1}
                          className="p-1 bg-white/90 rounded-full shadow-lg text-slate-600 disabled:opacity-0 hover:bg-white transition-all transform active:scale-90"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              {signedPhotos.length > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {signedPhotos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className={`w-1 h-1 rounded-full transition-all ${
                        i === photoIdx ? 'bg-primary w-3' : 'bg-slate-200'
                      }`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Imagem Aumentada */}
      {isLightboxOpen && signedPhotos[photoIdx] && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={signedPhotos[photoIdx].url}
              alt={signedPhotos[photoIdx].name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            />
            
            {signedPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIdx(p => Math.max(0, p - 1))}
                  disabled={photoIdx === 0}
                  className="absolute left-4 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all disabled:opacity-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={() => setPhotoIdx(p => Math.min(signedPhotos.length - 1, p + 1))}
                  disabled={photoIdx === signedPhotos.length - 1}
                  className="absolute right-4 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all disabled:opacity-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2">
            <span className="text-white/60 text-xs font-medium uppercase tracking-widest">
              {photoIdx + 1} de {signedPhotos.length}
            </span>
            <p className="text-white font-bold text-sm">{signedPhotos[photoIdx].name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
