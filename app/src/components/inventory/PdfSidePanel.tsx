import { useState, useEffect } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { downloadAttachment, getAttachmentUrl, type RichAttachment } from './acervoUtils';

export function PdfSidePanel({ item, onClose }: { item: RichAttachment; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        } catch {
          setPdfUrl(item.dataUrl || null);
          setIsLoading(false);
        }
      } else if (item.storagePath) {
        const url = await getAttachmentUrl(item.storagePath, 'Documents');
        setPdfUrl(url);
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
