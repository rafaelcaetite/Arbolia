import { useState, useMemo, useEffect } from 'react';
import {
  Search, Image as ImageIcon, FileText, Download, Eye,
  X, ChevronLeft, ChevronRight, AlertTriangle, ArrowLeftRight,
  SplitSquareHorizontal, List, LayoutGrid, Loader2, Pencil, Trash2
} from 'lucide-react';
import { useAppStore, type ServiceAttachment } from '../store/useAppStore';
import { SecureImage } from '../components/common/SecureImage';
import { supabase } from '../lib/supabase';
import { ActionModal } from '../components/common/ActionModal';
import { formatTreeId } from '../lib/treeUtils';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface RichAttachment extends ServiceAttachment {
  serviceId: string;
  serviceTipo: string;
  serviceData: string;
  treeEspecie: string;
  treeId: string;
  clienteNome: string;
  tags: string[];
  docValidade?: string; // Para documentos com vencimento
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00'); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000*60*60*24));
}

async function downloadAttachment(att: RichAttachment) {
  let url = att.dataUrl;
  
  if (!url && att.storagePath) {
    const bucket = att.type === 'image' ? 'Gallery' : 'Documents';
    const { data } = await supabase.storage.from(bucket).createSignedUrl(att.storagePath, 60);
    if (data) url = data.signedUrl;
  }

  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  a.download = att.name;
  a.click();
}

// ── Lightbox (Imagens) — fullscreen mobile friendly ───────────────────────────

function Lightbox({ items, index, onClose }: {
  items: RichAttachment[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const item = items[current];

  useEffect(() => {
    setCurrentUrl(null);
    const resolveUrl = async () => {
      if (item.dataUrl) {
        setCurrentUrl(item.dataUrl);
      } else if (item.storagePath) {
        const { data } = await supabase.storage.from('Gallery').createSignedUrl(item.storagePath, 3600);
        if (data) setCurrentUrl(data.signedUrl);
      }
    };
    resolveUrl();
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col min-w-0">
          <p className="text-white text-sm font-bold truncate">{item.name}</p>
          <p className="text-slate-400 text-xs truncate">{item.clienteNome} · {item.treeEspecie}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button onClick={() => downloadAttachment(item)}
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-all">
            <Download size={13} /> Baixar
          </button>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative px-4 min-h-0" onClick={e => e.stopPropagation()}>
        {currentUrl ? (
          <img src={currentUrl} alt={item.name} className="max-h-full max-w-full object-contain rounded-xl" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xs font-bold uppercase tracking-widest">Carregando...</span>
          </div>
        )}
        {items.length > 1 && (
          <>
            <button onClick={() => setCurrent(p => Math.max(0, p-1))} disabled={current === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-20 transition-all">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrent(p => Math.min(items.length-1, p+1))} disabled={current === items.length-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-20 transition-all">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Bottom counter */}
      <div className="shrink-0 py-3 text-center text-xs text-slate-500 font-medium">
        {current + 1} de {items.length}
      </div>
    </div>
  );
}

// ── PDF Viewer — fullscreen modal (funciona em mobile) ────────────────────────

function PdfSidePanel({ item, onClose }: { item: RichAttachment; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const resolve = async () => {
      if (item.dataUrl && item.dataUrl.startsWith('data:')) {
        try {
          const base64 = item.dataUrl.split(',')[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
          const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setIsLoading(false);
          return () => URL.revokeObjectURL(url);
        } catch (e) {
          setPdfUrl(item.dataUrl || null);
          setIsLoading(false);
        }
      } else if (item.storagePath) {
        const { data } = await supabase.storage.from('Documents').createSignedUrl(item.storagePath!, 3600);
        if (data) setPdfUrl(data.signedUrl);
        setIsLoading(false);
      } else {
        setPdfUrl(item.dataUrl || null);
        setIsLoading(false);
      }
    };
    resolve();
  }, [item]);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-white animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-500 transition-all active:scale-95">
          <X size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
          <p className="text-xs text-slate-400 truncate">{item.clienteNome} · {item.serviceTipo}</p>
        </div>
        <button onClick={() => downloadAttachment(item)}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-all shrink-0 active:scale-95">
          <Download size={13} /> Baixar
        </button>
      </div>

      {/* PDF content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xs font-bold uppercase tracking-widest">Carregando documento...</span>
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title={item.name}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────

export function Acervo() {
  const { services, trees, clients } = useAppStore();
  const [mode, setMode] = useState<'gallery' | 'list'>('gallery');
  const [search, setSearch] = useState('');
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: RichAttachment[]; index: number } | null>(null);
  const [pdfPanel, setPdfPanel] = useState<RichAttachment | null>(null);
  const [actionData, setActionData] = useState<{ 
    type: 'rename' | 'delete', 
    attachment: RichAttachment 
  } | null>(null);

  const { renameAttachment, deleteAttachment } = useAppStore();

  // Montar lista rica de todos os anexos de todos os serviços
  const allAttachments = useMemo<RichAttachment[]>(() => {
    const result: RichAttachment[] = [];
    services.forEach(svc => {
      if (!svc.attachmentsByTree) return;
      // Itera por treeId — cada árvore tem seus próprios anexos
      Object.entries(svc.attachmentsByTree).forEach(([treeId, atts]) => {
        if (!atts?.length) return;
        const tree = trees.find(t => t.id === treeId);
        const client = tree ? clients.find(c => c.id === tree.cliente_id) : undefined;
        const tags = [
          ...(client ? [client.nome] : []),
          ...(tree ? [tree.especie, formatTreeId(tree)] : []),
          svc.tipo,
          new Date(svc.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        ].map(t => t.toLowerCase());

        atts.forEach(att => {
          result.push({
            ...att,
            serviceId: svc.id,
            serviceTipo: svc.tipo,
            serviceData: svc.data,
            treeEspecie: tree?.especie ?? 'Árvore',
            treeId,
            clienteNome: client?.nome ?? 'Sem cliente',
            tags,
          });
        });
      });
    });
    return result;
  }, [services, trees, clients]);

  // Filtro por busca
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = allAttachments.filter(a =>
      mode === 'gallery' ? a.type === 'image' : a.type === 'pdf'
    );
    if (!q) return base;
    return base.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.tags.some(tag => tag.includes(q))
    );
  }, [allAttachments, mode, search]);

  // Modo Antes/Depois — agrupa por treeId
  const beforeAfterGroups = useMemo(() => {
    if (!beforeAfter) return null;
    const map: Record<string, RichAttachment[]> = {};
    filtered.forEach(a => {
      if (!map[a.treeId]) map[a.treeId] = [];
      map[a.treeId].push(a);
    });
    return Object.entries(map).filter(([, v]) => v.length >= 2);
  }, [filtered, beforeAfter]);

  const images = filtered.filter(a => a.type === 'image');

  return (
    <>
      {lightbox && (
        <Lightbox items={lightbox.items} index={lightbox.index} onClose={() => setLightbox(null)} />
      )}
      {pdfPanel && (
        <PdfSidePanel item={pdfPanel} onClose={() => setPdfPanel(null)} />
      )}

      <div className="h-full flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-xl">🗂️</span> Acervo
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {allAttachments.length} arquivo{allAttachments.length !== 1 ? 's' : ''} · {allAttachments.filter(a=>a.type==='image').length} fotos · {allAttachments.filter(a=>a.type==='pdf').length} docs
            </p>
          </div>

          {/* Switch Modo */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto shrink-0">
            <button
              onClick={() => { setMode('gallery'); setBeforeAfter(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'gallery' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={13} /> Galeria
            </button>
            <button
              onClick={() => { setMode('list'); setBeforeAfter(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={13} /> Documentos
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Busca */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={mode === 'gallery' ? 'Buscar fotos por árvore, cliente, data...' : 'Buscar documentos por espécie, laudo, cliente...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* Filtro Antes/Depois (só no modo galeria) */}
          {mode === 'gallery' && (
            <button
              onClick={() => setBeforeAfter(v => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                beforeAfter
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <SplitSquareHorizontal size={14} /> Antes/Depois
            </button>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto pb-4">

          {/* ── MODO GALERIA ── */}
          {mode === 'gallery' && (
            <>
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                  <ImageIcon size={48} />
                  <p className="text-sm font-medium">Nenhuma foto no acervo ainda.</p>
                  <p className="text-xs">Adicione fotos no Histórico de Serviços de qualquer árvore.</p>
                </div>
              ) : beforeAfter && beforeAfterGroups ? (
                // Modo Antes/Depois
                <div className="flex flex-col gap-6">
                  {beforeAfterGroups.map(([treeId, photos]) => (
                    <div key={treeId} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowLeftRight size={14} className="text-primary" />
                        <span className="text-xs font-bold text-slate-600">{photos[0].treeEspecie}</span>
                        <span className="text-[9px] font-mono text-slate-400">{formatTreeId(trees.find(t => t.id === treeId) ?? treeId)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {photos.slice(0, 2).map((photo, i) => (
                          <div key={photo.id} className="relative group">
                            <SecureImage
                              src={photo.dataUrl || photo.storagePath}
                              alt={photo.name}
                              bucket="Gallery"
                              className="w-full h-40 object-cover rounded-xl cursor-pointer border border-slate-100 hover:border-primary/30 transition-all"
                              onClick={() => setLightbox({ items: photos, index: i })}
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionData({ type: 'rename', attachment: photo });
                                }}
                                className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-slate-600 hover:text-primary transition-all"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionData({ type: 'delete', attachment: photo });
                                }}
                                className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-900/70 text-white px-2 py-0.5 rounded-md">
                              {i === 0 ? 'Antes' : 'Depois'}
                            </span>
                            <span className="absolute bottom-2 right-2 text-[9px] bg-white/90 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              {new Date(photo.serviceData + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid normal — actions always visible on mobile
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {images.map((photo, i) => (
                    <div key={photo.id} className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all"
                      onClick={() => setLightbox({ items: images, index: i })}>
                      <SecureImage 
                        src={photo.dataUrl || photo.storagePath} 
                        alt={photo.name} 
                        bucket="Gallery"
                        className="w-full h-32 group-hover:scale-105 transition-transform duration-300 object-cover" 
                      />
                      {/* Actions — always visible on mobile via opacity-100 md:opacity-0 */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionData({ type: 'rename', attachment: photo });
                          }}
                          className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-slate-600 hover:text-primary transition-all"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionData({ type: 'delete', attachment: photo });
                          }}
                          className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-[10px] font-bold truncate">{photo.treeEspecie}</p>
                        <p className="text-white/70 text-[9px] truncate">{photo.clienteNome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── MODO LISTA (DOCUMENTOS) ── */}
          {mode === 'list' && (
            <>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                  <FileText size={48} />
                  <p className="text-sm font-medium">Nenhum documento no acervo ainda.</p>
                  <p className="text-xs">Adicione PDFs no Histórico de Serviços de qualquer árvore.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map(doc => {
                    const daysLeft = doc.docValidade ? daysUntil(doc.docValidade) : null;
                    const isExpiringSoon = daysLeft !== null && daysLeft <= 15;
                    return (
                      <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
                        {/* Linha 1: ícone + nome + validade */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            {isExpiringSoon
                              ? <AlertTriangle size={18} className="text-red-500" />
                              : <FileText size={18} className="text-blue-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{doc.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(doc.serviceData + 'T00:00:00').toLocaleDateString('pt-BR')}
                              {daysLeft !== null && (
                                <span className={`ml-2 font-bold px-1.5 py-0.5 rounded-full text-[9px] ${isExpiringSoon ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {daysLeft > 0 ? `${daysLeft}d restantes` : 'Vencido'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Linha 2: tags */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">{doc.clienteNome}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{doc.treeEspecie}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{doc.serviceTipo}</span>
                        </div>

                        {/* Linha 3: ações */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                          <button
                            onClick={() => setPdfPanel(doc)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl transition-all active:scale-95"
                          >
                            <Eye size={14} /> Visualizar
                          </button>
                          <button
                            onClick={() => downloadAttachment(doc)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 py-2.5 rounded-xl transition-all active:scale-95"
                          >
                            <Download size={14} /> Baixar
                          </button>
                          <button
                            onClick={() => setActionData({ type: 'rename', attachment: doc })}
                            className="p-2.5 text-slate-400 hover:text-primary bg-slate-50 hover:bg-primary/5 border border-slate-200 rounded-xl transition-all active:scale-95"
                            title="Renomear"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setActionData({ type: 'delete', attachment: doc })}
                            className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl transition-all active:scale-95"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ActionModal
        isOpen={!!actionData}
        onClose={() => setActionData(null)}
        type={actionData?.type || 'delete'}
        title={actionData?.type === 'rename' ? 'Renomear Arquivo' : 'Confirmar Exclusão'}
        description={actionData?.type === 'rename' 
          ? `Altere o nome do anexo '${actionData.attachment.name}'.` 
          : `Tem certeza que deseja excluir '${actionData?.attachment.name}'? Esta ação é irreversível.`
        }
        initialValue={actionData?.attachment.name}
        confirmLabel={actionData?.type === 'rename' ? 'Salvar Nome' : 'Sim, excluir'}
        onConfirm={async (val) => {
          if (!actionData) return;
          if (actionData.type === 'rename' && val) {
            await renameAttachment(actionData.attachment.serviceId, actionData.attachment.treeId, actionData.attachment.id, val);
          } else if (actionData.type === 'delete') {
            await deleteAttachment(actionData.attachment.serviceId, actionData.attachment.treeId, actionData.attachment.id);
          }
        }}
      />
    </>
  );
}
