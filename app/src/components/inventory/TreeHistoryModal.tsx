import { useRef, useState } from 'react';
import { X, Calendar, Upload, ImagePlus, FileText, Image, Eye, ChevronDown, Pencil, Trash2, Download } from 'lucide-react';
import { useAppStore, type ServiceAttachment } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { ActionModal } from '../common/ActionModal';
import { AttachmentViewer } from '../common/AttachmentViewer';


// ── Botões de Anexo por Serviço ──────────────────────────────────────────────
function AttachmentBar({ serviceId, treeId, attachments }: { serviceId: string; treeId: string; attachments: ServiceAttachment[] }) {
  const { addServiceAttachment, renameAttachment, deleteAttachment } = useAppStore();
  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [viewingAttachment, setViewingAttachment] = useState<ServiceAttachment | null>(null);
  const [showList, setShowList] = useState(false);
  const [actionData, setActionData] = useState<{ 
    type: 'rename' | 'delete', 
    attachment: ServiceAttachment 
  } | null>(null);

  const hasDocs   = attachments.some(a => a.type === 'pdf');
  const hasImages = attachments.some(a => a.type === 'image');

  const readFile = async (file: File, type: 'pdf' | 'image') => {
    const bucket = type === 'image' ? 'Gallery' : 'Documents';
    const folder = type === 'image' ? 'history' : 'attachments';
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storagePath = `${folder}/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file);

      if (error) throw error;

      const attachment: ServiceAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type,
        storagePath,
        size: file.size,
      };
      addServiceAttachment(serviceId, treeId, attachment);
    } catch (err) {
      console.error('Erro ao subir arquivo:', err);
      alert('Falha ao enviar arquivo para o Storage.');
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file, 'pdf');
    e.target.value = '';
  };

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(f => readFile(f, 'image'));
    e.target.value = '';
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <>
      {viewingAttachment && (
        <AttachmentViewer attachment={viewingAttachment} onClose={() => setViewingAttachment(null)} />
      )}

      <input ref={docInputRef} type="file" accept=".pdf" className="hidden" onChange={handleDocChange} />
      <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImgChange} />

      <div className="mt-3 flex flex-col gap-2">
        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Botão PDF */}
          <button
            onClick={() => docInputRef.current?.click()}
            title="Anexar documento PDF"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              hasDocs
                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
          >
            <Upload size={11} />
            PDF
            {hasDocs && (
              <span className="bg-blue-500 text-white text-[8px] px-1 py-0.5 rounded-full leading-none">
                {attachments.filter(a => a.type === 'pdf').length}
              </span>
            )}
          </button>

          {/* Botão Foto */}
          <button
            onClick={() => imgInputRef.current?.click()}
            title="Anexar fotos"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              hasImages
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
          >
            <ImagePlus size={11} />
            Fotos
            {hasImages && (
              <span className="bg-emerald-500 text-white text-[8px] px-1 py-0.5 rounded-full leading-none">
                {attachments.filter(a => a.type === 'image').length}
              </span>
            )}
          </button>

          {/* Ver anexos (se houver) */}
          {attachments.length > 0 && (
            <button
              onClick={() => setShowList(v => !v)}
              className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Eye size={11} />
              Ver ({attachments.length})
              <ChevronDown size={11} className={`transition-transform ${showList ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Lista de anexos */}
        {showList && attachments.length > 0 && (
          <div className="flex flex-col gap-1 animate-in slide-in-from-top-1 duration-150">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-1 group">
                <button
                  onClick={() => setViewingAttachment(att)}
                  className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-slate-300 px-2.5 py-1.5 rounded-lg text-left transition-colors"
                >
                  {att.type === 'pdf'
                    ? <FileText size={12} className="text-blue-500 shrink-0" />
                    : <Image size={12} className="text-emerald-500 shrink-0" />
                  }
                  <span className="text-[10px] font-medium text-slate-600 truncate flex-1">
                    {att.name}
                  </span>
                  <span className="text-[9px] text-slate-400 shrink-0">{formatSize(att.size)}</span>
                </button>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const bucket = att.type === 'image' ? 'Gallery' : 'Documents';
                      const { data } = await supabase.storage.from(bucket).createSignedUrl(att.storagePath!, 3600);
                      if (data?.signedUrl) {
                        const a = document.createElement('a');
                        a.href = data.signedUrl;
                        a.download = att.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Baixar"
                  >
                    <Download size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionData({ type: 'rename', attachment: att });
                    }}
                    className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                    title="Renomear"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionData({ type: 'delete', attachment: att });
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ActionModal
        isOpen={!!actionData}
        onClose={() => setActionData(null)}
        type={actionData?.type || 'delete'}
        title={actionData?.type === 'rename' ? 'Renomear Anexo' : 'Confirmar Exclusão'}
        description={actionData?.type === 'rename' 
          ? `Altere o nome do anexo '${actionData.attachment.name}'.` 
          : `Tem certeza que deseja excluir '${actionData?.attachment.name}'?`
        }
        initialValue={actionData?.attachment.name}
        confirmLabel={actionData?.type === 'rename' ? 'Salvar Nome' : 'Sim, excluir'}
        onConfirm={async (val) => {
          if (!actionData) return;
          if (actionData.type === 'rename' && val) {
            await renameAttachment(serviceId, treeId, actionData.attachment.id, val);
          } else if (actionData.type === 'delete') {
            await deleteAttachment(serviceId, treeId, actionData.attachment.id);
          }
        }}
      />
    </>
  );
}

// ── Modal Principal ──────────────────────────────────────────────────────────
export function TreeHistoryModal() {
  const { isHistoryModalOpen, viewingHistoryTreeId, trees, services, closeHistoryModal } = useAppStore();

  if (!isHistoryModalOpen || !viewingHistoryTreeId) return null;

  const tree = trees.find(t => t.id === viewingHistoryTreeId);
  const treeServices = services
    .filter(s => s.treeIds.includes(viewingHistoryTreeId))
    .sort((a, b) => new Date(b.data + 'T00:00:00').getTime() - new Date(a.data + 'T00:00:00').getTime());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={closeHistoryModal} />

      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-md relative z-10 overflow-hidden flex flex-col h-[85vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Histórico de Serviços</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-medium text-slate-500">{tree?.especie}</p>
              {tree && (
                <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-400 text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wider">
                  # {tree.id.slice(0, 8).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={closeHistoryModal}
            className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {treeServices.length === 0 ? (
            <div className="text-center text-slate-400 py-10 flex flex-col items-center">
              <Calendar size={32} className="text-slate-300 mb-3" />
              <p className="text-sm">Nenhum serviço registrado para esta árvore.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 py-2 space-y-6">
              {treeServices.map((svc) => (
                <div key={svc.id} className="relative pl-6">
                  {/* Dot da timeline */}
                  <span className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    svc.status === 'concluido' ? 'bg-emerald-500' :
                    svc.status === 'atrasado'  ? 'bg-red-500'     : 'bg-blue-500'
                  }`} />

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    {/* Cabeçalho do serviço */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-sm">{svc.tipo}</h4>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        svc.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
                        svc.status === 'atrasado'  ? 'bg-red-100 text-red-700'         : 'bg-blue-100 text-blue-700'
                      }`}>
                        {svc.status}
                      </span>
                    </div>

                    {/* Dados */}
                    <div className="flex flex-col gap-1 text-xs text-slate-500 mb-1">
                      <span><strong>Data:</strong> {new Date(svc.data + 'T00:00:00').toLocaleDateString()}{svc.horario && ` às ${svc.horario}`}</span>
                      <span><strong>Responsável:</strong> {svc.responsavel}</span>
                    </div>

                    {/* Barra de Anexos */}
                    <AttachmentBar serviceId={svc.id} treeId={viewingHistoryTreeId} attachments={svc.attachmentsByTree?.[viewingHistoryTreeId] ?? []} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
