import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { type ServiceAttachment } from '../../store/useAppStore';

interface AttachmentViewerProps {
  attachment: ServiceAttachment;
  onClose: () => void;
}

export function AttachmentViewer({ attachment, onClose }: AttachmentViewerProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadSecureUrl() {
      if (attachment.storagePath) {
        const bucket = attachment.type === 'image' ? 'Gallery' : 'Documents';
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(attachment.storagePath, 3600);
        
        if (error) {
          console.error('Erro ao gerar URL assinada:', error);
          setDisplayUrl(attachment.dataUrl || null);
        } else {
          setDisplayUrl(data.signedUrl);
        }
      } else if (attachment.type === 'pdf' && attachment.dataUrl?.startsWith('data:')) {
        try {
          const base64 = attachment.dataUrl.split(',')[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setDisplayUrl(url);
          return () => URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Erro ao converter PDF para Blob:', e);
          setDisplayUrl(attachment.dataUrl || null);
        }
      } else {
        setDisplayUrl(attachment.dataUrl || null);
      }
    }

    loadSecureUrl();
  }, [attachment]);

  const handleDownload = async () => {
    if (!displayUrl) return;
    try {
      // Forçamos o download via Blob para evitar que abra em nova guia
      const response = await fetch(displayUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      // Fallback básico se o fetch falhar (CORS etc)
      const a = document.createElement('a');
      a.href = displayUrl;
      a.download = attachment.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800 truncate max-w-md">{attachment.name}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {attachment.type === 'image' ? 'Foto / Imagem' : 'Documento PDF'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Download size={14} /> Baixar
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50/50">
          {attachment.type === 'image' ? (
            <img 
              src={displayUrl || ''} 
              alt={attachment.name} 
              className="max-w-full max-h-full rounded-2xl shadow-xl border border-white object-contain animate-in fade-in duration-500" 
            />
          ) : (
            <iframe 
              src={displayUrl || ''} 
              title={attachment.name} 
              className="w-full h-[70vh] rounded-2xl border border-slate-200 shadow-inner bg-white" 
            />
          )}
        </div>
      </div>
    </div>
  );
}
