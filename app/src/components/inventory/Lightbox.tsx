import { useState, useEffect } from 'react';
import { Download, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { downloadAttachment, getAttachmentUrl, type RichAttachment } from './acervoUtils';

export function Lightbox({ items, index, onClose }: {
  items: RichAttachment[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const item = items[current];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUrl(null);
    const resolveUrl = async () => {
      if (item.dataUrl) {
        setCurrentUrl(item.dataUrl);
      } else if (item.storagePath) {
        const url = await getAttachmentUrl(item.storagePath, 'Gallery');
        setCurrentUrl(url);
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
