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

// ── Lightbox (Imagens) ────────────────────────────────────────────────────────

function Lightbox({ items, index, onClose }: {
  items: RichAttachment[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const item = items[current];

  useEffect(() => {
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
    <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="flex items-stretch max-w-5xl w-full mx-4 gap-0 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Imagem */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[400px]">
          {currentUrl ? (
            <img src={currentUrl} alt={item.name} className="max-h-[85vh] max-w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 className="animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Carregando imagem segura...</span>
            </div>
          )}
          {items.length > 1 && (
            <>
              <button onClick={() => setCurrent(p => Math.max(0, p-1))} disabled={current === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrent(p => Math.min(items.length-1, p+1))} disabled={current === items.length-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 transition-all">
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Painel lateral */}
        <div className="w-64 bg-white flex flex-col shrink-0">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalhes</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Arquivo</p>
              <p className="text-sm font-semibold text-slate-700 break-all">{item.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Árvore</p>
              <p className="text-sm font-semibold text-slate-700">{item.treeEspecie}</p>
              <p className="text-[10px] font-mono text-slate-400"># {item.treeId.slice(0,8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Serviço</p>
              <p className="text-sm font-semibold text-slate-700">{item.serviceTipo}</p>
              <p className="text-xs text-slate-400">{new Date(item.serviceData + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-sm font-semibold text-slate-700">{item.clienteNome}</p>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <button onClick={() => downloadAttachment(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-all">
              <Download size={13} /> Baixar
            </button>
          </div>
          <div className="px-4 pb-4 text-center text-[10px] text-slate-400">
            {current + 1} de {items.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PDF Viewer Lateral ────────────────────────────────────────────────────────

function PdfSidePanel({ item, onClose }: { item: RichAttachment; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item.dataUrl && item.dataUrl.startsWith('data:')) {
      try {
        const base64 = item.dataUrl.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Erro ao converter PDF para Blob:', e);
        setPdfUrl(item.dataUrl || null);
      }
    } else if (item.storagePath) {
      const resolveStoragePdf = async () => {
        const { data } = await supabase.storage.from('Documents').createSignedUrl(item.storagePath!, 3600);
        if (data) setPdfUrl(data.signedUrl);
      };
      resolveStoragePdf();
    } else {
      setPdfUrl(item.dataUrl || null);
    }
  }, [item]);

  return (
    <div className="fixed inset-0 z-[300] flex" onClick={onClose}>
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" />
      <div className="w-[640px] max-w-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-right-4 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
            <p className="text-xs text-slate-400">{item.clienteNome} · {item.serviceTipo}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => downloadAttachment(item)}
              className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-all">
              <Download size={13} /> Baixar
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400">
              <X size={16} />
            </button>
          </div>
        </div>
        <iframe src={pdfUrl || ''} title={item.name} className="flex-1 w-full border-0" />
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
          ...(tree ? [tree.especie, `# ${tree.id.slice(0, 8).toUpperCase()}`] : []),
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
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-2xl">🗂️</span> Acervo
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {allAttachments.length} arquivo{allAttachments.length !== 1 ? 's' : ''} · {allAttachments.filter(a=>a.type==='image').length} fotos · {allAttachments.filter(a=>a.type==='pdf').length} documentos
            </p>
          </div>

          {/* Switch Modo */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => { setMode('gallery'); setBeforeAfter(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'gallery' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={13} /> Galeria
            </button>
            <button
              onClick={() => { setMode('list'); setBeforeAfter(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                        <span className="text-[9px] font-mono text-slate-400"># {treeId.slice(0,8).toUpperCase()}</span>
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
                // Grid normal
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {images.map((photo, i) => (
                    <div key={photo.id} className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all"
                      onClick={() => setLightbox({ items: images, index: i })}>
                      <SecureImage 
                        src={photo.dataUrl || photo.storagePath} 
                        alt={photo.name} 
                        bucket="Gallery"
                        className="w-full h-32 group-hover:scale-105 transition-transform duration-300" 
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
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
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
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Validade</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map(doc => {
                        const daysLeft = doc.docValidade ? daysUntil(doc.docValidade) : null;
                        const isExpiringSoon = daysLeft !== null && daysLeft <= 15;
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                {isExpiringSoon && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                                <FileText size={15} className="text-blue-500 shrink-0" />
                                <span className="font-medium text-slate-700 text-xs">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{doc.clienteNome}</span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{doc.treeEspecie}</span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{doc.serviceTipo}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {new Date(doc.serviceData + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3">
                              {daysLeft !== null ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isExpiringSoon ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                  {daysLeft > 0 ? `${daysLeft}d` : 'Vencido'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => setActionData({ type: 'rename', attachment: doc })}
                                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                  title="Renomear"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setActionData({ type: 'delete', attachment: doc })}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                                <div className="w-px h-4 bg-slate-100 mx-0.5" />
                                <button
                                  onClick={() => setPdfPanel(doc)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-primary bg-slate-50 hover:bg-primary/10 border border-slate-200 hover:border-primary/20 px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  <Eye size={11} /> Ver
                                </button>
                                <button
                                  onClick={() => downloadAttachment(doc)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-white bg-primary hover:bg-primary/90 px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  <Download size={11} /> Baixar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
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
