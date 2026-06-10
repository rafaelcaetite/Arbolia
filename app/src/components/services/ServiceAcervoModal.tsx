import { useState } from 'react';
import { User, FileText, Pencil, Trash2, Eye, ChevronRight, MapPin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Service, ServiceAttachment } from '../../store/useAppStore';
import { AttachmentViewer } from '../common/AttachmentViewer';
import { formatTreeId } from '../../lib/treeUtils';

interface ServiceAcervoModalProps {
  service: Service;
  onClose: () => void;
}

export function ServiceAcervoModal({ service, onClose }: ServiceAcervoModalProps) {
  const { trees, clients, renameAttachment, deleteAttachment } = useAppStore();
  const [viewingServiceAttachment, setViewingServiceAttachment] = useState<ServiceAttachment & { treeId: string } | null>(null);

  const [renamingItem, setRenamingItem] = useState<ServiceAttachment & { treeId: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingItem, setDeletingItem] = useState<ServiceAttachment & { treeId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const client = clients.find(c => {
    const treeIds = service?.treeIds || [];
    const tree = trees.find(t => treeIds.includes(t.id));
    return tree?.cliente_id === c.id;
  });

  const serviceTrees = trees.filter(t => service?.treeIds?.includes(t.id));
  
  // Coletar todos os anexos de todas as árvores deste serviço com seus respectivos treeIds
  const allServiceAttachments: (ServiceAttachment & { treeId: string })[] = [];
  if (service.attachmentsByTree) {
    Object.entries(service.attachmentsByTree).forEach(([treeId, attachments]: [string, ServiceAttachment[] | unknown]) => {
      if (Array.isArray(attachments)) {
        attachments.forEach((att: ServiceAttachment) => {
          allServiceAttachments.push({ ...att, treeId });
        });
      }
    });
  }

  const photos = allServiceAttachments.filter(a => a.type === 'image');
  const docs = allServiceAttachments.filter(a => a.type === 'pdf');

  const handleRenameClick = (item: ServiceAttachment & { treeId: string }) => {
    setRenamingItem(item);
    setNewName(item.name || '');
  };

  const handleDeleteClick = (item: ServiceAttachment & { treeId: string }) => {
    setDeletingItem(item);
  };

  const confirmRename = async () => {
    if (!renamingItem || !newName.trim()) return;
    setIsRenaming(true);
    try {
      await renameAttachment(service.id, renamingItem.treeId, renamingItem.id, newName.trim());
      setRenamingItem(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao renomear arquivo.");
    } finally {
      setIsRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteAttachment(service.id, deletingItem.treeId, deletingItem.id);
      setDeletingItem(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir arquivo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                service.tipo === 'Poda' ? 'bg-blue-100 text-blue-700' :
                service.tipo === 'Supressão' ? 'bg-red-100 text-red-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {service.tipo}
              </span>
              <span className="text-xs text-slate-400 font-medium">#{service.id.slice(0, 8)}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Acervo do Atendimento</h2>
            <div className="flex flex-col gap-1 mt-1 text-sm text-slate-500">
              <span>{client?.nome || 'Cliente não identificado'} • {new Date(service.data + 'T00:00:00').toLocaleDateString()}</span>
              {client?.endereco && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin size={12} /> {client.endereco}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Resumo das Árvores */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Árvores Atendidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {serviceTrees.map(tree => (
                <div key={tree.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary border border-slate-100 shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{tree.especie}</p>
                    <p className="text-[10px] text-slate-400">ID: {formatTreeId(tree.id)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Fotos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fotos e Registros</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                {photos.length} fotos
              </span>
            </div>
            
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map(photo => (
                  <div 
                    key={photo.id}
                    className="aspect-square rounded-2xl overflow-hidden border border-slate-100 hover:ring-2 hover:ring-primary/20 transition-all group relative bg-slate-50"
                  >
                    {(photo.dataUrl || photo.storagePath) && (
                      <img src={photo.dataUrl || photo.storagePath} alt={photo.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    )}
                    
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-3 transition-opacity">
                      {/* Top: Photo Name */}
                      <div className="w-full">
                        <p className="text-[10px] text-white/90 font-bold truncate">{photo.name}</p>
                      </div>
                      
                      {/* Bottom: Action Buttons */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRenameClick(photo); }}
                          title="Renomear"
                          className="p-1.5 bg-white/10 hover:bg-white/30 text-white rounded-lg transition-all active:scale-90"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(photo); }}
                          title="Excluir"
                          className="p-1.5 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-all active:scale-90"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingServiceAttachment(photo); }}
                          title="Visualizar"
                          className="p-1.5 bg-white/15 hover:bg-primary text-white rounded-lg transition-all active:scale-90"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                <p className="text-sm text-slate-400 italic">Nenhuma foto anexada a este atendimento.</p>
              </div>
            )}
          </section>

          {/* Documentos / Laudos */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Documentos e Laudos</h3>
            <div className="space-y-3">
              {docs.map(doc => (
                <div 
                  key={doc.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-100/50 transition-all duration-200"
                >
                  {/* Left Clickable Area (to View) */}
                  <div 
                    onClick={() => setViewingServiceAttachment(doc)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-700 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">PDF • {(doc.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>

                  {/* Actions on the Right */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    <button
                      onClick={() => handleRenameClick(doc)}
                      title="Renomear"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doc)}
                      title="Excluir"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => setViewingServiceAttachment(doc)}
                      title="Visualizar / Baixar"
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {docs.length === 0 && (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                  <p className="text-sm text-slate-400 italic">Nenhum documento ou laudo disponível.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Viewer de Anexo (Full Screen / Premium Modal) */}
      {viewingServiceAttachment && (
        <AttachmentViewer 
          attachment={viewingServiceAttachment} 
          onClose={() => setViewingServiceAttachment(null)} 
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">Confirmar Exclusão</h3>
            <p className="text-sm text-slate-500">
              Tem certeza que deseja excluir o anexo <strong className="text-slate-700">{deletingItem.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renomear */}
      {renamingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">Renomear Anexo</h3>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Novo Nome do Arquivo</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700"
                placeholder="Nome do arquivo"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setRenamingItem(null)}
                disabled={isRenaming}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRename}
                disabled={isRenaming || !newName.trim()}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-colors"
              >
                {isRenaming ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
