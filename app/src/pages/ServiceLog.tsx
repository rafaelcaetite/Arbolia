import React, { useState, useMemo } from 'react';

import { useAppStore } from '../store/useAppStore';
import { Search, FileText, User, ChevronRight, Download, Eye, Pencil, Trash2, MapPin } from 'lucide-react';
import { ExportLogModal } from '../components/inventory/ExportLogModal';
import { AttachmentViewer } from '../components/common/AttachmentViewer';


export function ServiceLog() {
  const { services, trees, clients, openServiceModal, userProfile, deleteService } = useAppStore();
  
  const [serviceToDelete, setServiceToDelete] = useState<any | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [serviceType, setServiceType] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Tipos de serviço únicos para o filtro
  const serviceTypes = ['Todos', 'Poda', 'Supressão', 'Avaliação', 'Tratamento'];
  const statusOptions = ['Todos', 'concluido', 'agendado', 'atrasado'];
  
  const isDataLoading = trees.length === 0 || clients.length === 0;

  // Função para pegar o nome do cliente associado ao serviço
  const getClientName = (svc: any) => {
    const treeIds = svc?.treeIds || svc?.tree_ids || [];
    if (!Array.isArray(treeIds) || treeIds.length === 0) return 'N/A';
    
    // Pegamos o cliente da primeira árvore vinculada ao serviço
    const tree = trees.find(t => treeIds.includes(t.id));
    if (!tree) return 'N/A';
    const client = clients.find(c => c.id === tree.cliente_id);
    return String(client?.nome || 'N/A');
  };

  // Função para formatar a lista de árvores
  const getTreesSummary = (svc: any) => {
    const treeIds = svc?.treeIds || svc?.tree_ids || [];
    if (!Array.isArray(treeIds) || treeIds.length === 0) return 'N/A';
    
    const svcTrees = trees.filter(t => treeIds.includes(t.id));
    if (svcTrees.length === 0) {
      return treeIds.length === 1 
        ? `Árvore #${treeIds[0].slice(0, 8)}`
        : `${treeIds.length} árvores (Carregando...)`;
    }
    
    if (svcTrees.length === 1) return `${svcTrees[0].especie} (#${svcTrees[0].id.slice(0, 4)})`;
    return `${svcTrees[0].especie} + ${svcTrees.length - 1} outras`;
  };

  // Lógica de filtragem
  const filteredServices = useMemo(() => {
    return services.filter(svc => {
      // Filtro por termo de busca (Cliente, Responsável ou ID)
      const treeIds = svc?.treeIds || [];
      const client = clients.find(c => treeIds.some(tId => trees.find(t => t.id === tId)?.cliente_id === c.id));
      const clientName = client?.nome?.toLowerCase() || '';
      const responsible = svc?.responsavel?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = clientName.includes(search) || 
                            responsible.includes(search) || 
                            svc?.id?.toLowerCase().includes(search);


      // Filtro por tipo
      const matchesType = serviceType === 'Todos' || svc.tipo === serviceType;

      // Filtro por status
      const matchesStatus = statusFilter === 'Todos' || svc.status === statusFilter;

      // Filtro por data
      const svcDate = new Date(svc.data + 'T00:00:00');
      const matchesDateStart = !dateStart || svcDate >= new Date(dateStart + 'T00:00:00');
      const matchesDateEnd = !dateEnd || svcDate <= new Date(dateEnd + 'T00:00:00');

      return matchesSearch && matchesType && matchesStatus && matchesDateStart && matchesDateEnd;
    }).sort((a, b) => new Date(b.data + 'T00:00:00').getTime() - new Date(a.data + 'T00:00:00').getTime());
  }, [services, trees, clients, searchTerm, serviceType, statusFilter, dateStart, dateEnd]);
  
  // Estados para ordenação
  const [sortConfig, setSortConfig] = useState<{ field: string, direction: 'asc' | 'desc' }>({
    field: 'data',
    direction: 'desc'
  });

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Lógica de ordenação global
  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortConfig.field) {
        case 'data':
          valA = new Date((a.data || '1970-01-01') + 'T' + (a.horario || '00:00')).getTime();
          valB = new Date((b.data || '1970-01-01') + 'T' + (b.horario || '00:00')).getTime();
          break;
        case 'cliente':
          valA = (getClientName(a) || 'N/A').toLowerCase();
          valB = (getClientName(b) || 'N/A').toLowerCase();
          break;
        case 'arvores':
          valA = (getTreesSummary(a) || 'N/A').toLowerCase();
          valB = (getTreesSummary(b) || 'N/A').toLowerCase();
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }


      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredServices, sortConfig, trees, clients]);

  // Lógica de agrupamento por mês
  const groupedServices = useMemo(() => {
    // Se a ordenação não for por data, mostramos como um bloco único para não confundir
    if (sortConfig.field !== 'data') {
      const label = sortConfig.field === 'cliente' ? 'Clientes' : 
                    sortConfig.field === 'arvores' ? 'Árvores' : 
                    sortConfig.field === 'status' ? 'Status' : sortConfig.field;
      return [{ key: 'all', label: `Ordenado por ${label} (${sortConfig.direction === 'asc' ? 'Crescente' : 'Decrescente'})`, services: sortedServices }];
    }

    const groups: { [key: string]: any[] } = {};
    
    sortedServices.forEach(svc => {
      const date = new Date(svc.data + 'T00:00:00');
      const groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const groupLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({ ...svc, groupLabel });
    });

    return Object.keys(groups)
      .sort((a, b) => sortConfig.direction === 'desc' ? b.localeCompare(a) : a.localeCompare(b))
      .map(key => ({
        key,
        label: groups[key][0].groupLabel,
        services: groups[key]
      }));
  }, [sortedServices, sortConfig.field, sortConfig.direction]);

  const [viewingService, setViewingService] = useState<any | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  if (isDataLoading && services.length > 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium">Sincronizando dados do inventário...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Modal de Acervo do Atendimento */}
      {viewingService && (
        <ServiceAcervoModal 
          service={viewingService} 
          onClose={() => setViewingService(null)} 
        />
      )}

      {/* Modal de Exportação */}
      {isExportModalOpen && (
        <ExportLogModal 
          onClose={() => setIsExportModalOpen(false)}
          services={services}
          trees={trees}
          clients={clients}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {serviceToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Confirmar Exclusão</h3>
                <p className="text-xs text-slate-500">Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400 uppercase">Tipo:</span>
                <span className="font-bold text-slate-700">{serviceToDelete.tipo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400 uppercase">Cliente:</span>
                <span className="font-bold text-slate-700">{getClientName(serviceToDelete)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400 uppercase">Data:</span>
                <span className="font-bold text-slate-700">
                  {new Date(serviceToDelete.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
              {serviceToDelete.horario && (
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-400 uppercase">Horário:</span>
                  <span className="font-bold text-slate-700">{serviceToDelete.horario.slice(0, 5)}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente este agendamento de atendimento técnico? Todos os vínculos com as árvores serão removidos.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setServiceToDelete(null)}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteService(serviceToDelete.id);
                    setServiceToDelete(null);
                  } catch (err) {
                    alert("Erro ao excluir o serviço. Tente novamente.");
                  }
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 hover:shadow-red-600/10 transition-all shadow-lg active:scale-95"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Log de Atendimentos</h1>
          <p className="text-slate-500 text-sm">Histórico global de todos os serviços e auditoria do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportClick}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>


      {/* Painel de Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cliente, técnico ou ID do serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Tipo de Serviço */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Tipo de Serviço</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt === 'Todos' ? 'Todos' : opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Datas */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Início</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Fim</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col w-full max-w-[100vw]">
        <div className="overflow-x-auto w-full touch-pan-x">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th 
                  onClick={() => handleSort('data')}
                  className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                >
                  <div className="flex items-center gap-1">
                    Data
                    <ChevronRight size={12} className={`transition-transform ${sortConfig.field === 'data' ? (sortConfig.direction === 'asc' ? '-rotate-90 text-primary' : 'rotate-90 text-primary') : 'opacity-0 group-hover/th:opacity-50'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cliente')}
                  className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                >
                  <div className="flex items-center gap-1">
                    Cliente
                    <ChevronRight size={12} className={`transition-transform ${sortConfig.field === 'cliente' ? (sortConfig.direction === 'asc' ? '-rotate-90 text-primary' : 'rotate-90 text-primary') : 'opacity-0 group-hover/th:opacity-50'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('arvores')}
                  className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                >
                  <div className="flex items-center gap-1">
                    Árvore(s)
                    <ChevronRight size={12} className={`transition-transform ${sortConfig.field === 'arvores' ? (sortConfig.direction === 'asc' ? '-rotate-90 text-primary' : 'rotate-90 text-primary') : 'opacity-0 group-hover/th:opacity-50'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Serviço</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Técnico</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ChevronRight size={12} className={`transition-transform ${sortConfig.field === 'status' ? (sortConfig.direction === 'asc' ? '-rotate-90 text-primary' : 'rotate-90 text-primary') : 'opacity-0 group-hover/th:opacity-50'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="">

              {groupedServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    Nenhum atendimento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                groupedServices.map((group) => (
                  <React.Fragment key={group.key}>
                    {/* Header do Grupo (Mês/Ano) */}
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <td colSpan={7} className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {group.label}
                      </td>
                    </tr>

                    {group.services.map((svc) => (
                      <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50 last:border-0">

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">
                              {new Date(svc.data + 'T00:00:00').toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400">{svc.horario ? svc.horario.slice(0, 5) : 'Horário não def.'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 font-medium">{getClientName(svc)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 truncate max-w-[150px]">
                              {getTreesSummary(svc)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            svc.tipo === 'Poda' ? 'bg-blue-50 text-blue-600' :
                            svc.tipo === 'Supressão' ? 'bg-red-50 text-red-600' :
                            svc.tipo === 'Avaliação' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {svc.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User size={14} className="text-slate-400" />
                            {svc.responsavel}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            svc.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
                            svc.status === 'atrasado' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {svc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setViewingService(svc)}
                              title="Ver Detalhes"
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            >
                              <Eye size={16} />
                            </button>

                            {svc.status === 'agendado' && (
                              <button 
                                onClick={() => openServiceModal(svc.id)}
                                title="Editar Agendamento"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Pencil size={16} />
                              </button>
                            )}

                            {userProfile?.role === 'admin' && (svc.status === 'agendado' || svc.status === 'atrasado') && (
                              <button 
                                onClick={() => setServiceToDelete(svc)}
                                title="Excluir Agendamento"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>

          </table>
        </div>
        
        {/* Footer da Tabela / Paginação Mock */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">
            Mostrando {filteredServices.length} de {services.length} atendimentos
          </span>
          <div className="flex items-center gap-1">
            <button disabled className="p-1 text-slate-300 cursor-not-allowed"><ChevronRight size={18} className="rotate-180" /></button>
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-lg shadow-sm shadow-primary/20">1</button>
            <button disabled className="p-1 text-slate-300 cursor-not-allowed"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Acervo do Atendimento ──────────────────────────────────────────
function ServiceAcervoModal({ service, onClose }: { service: any; onClose: () => void }) {
  const { trees, clients, renameAttachment, deleteAttachment } = useAppStore();
  const [viewingAttachment, setViewingAttachment] = useState<any | null>(null);

  const [renamingItem, setRenamingItem] = useState<any | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const client = clients.find(c => {
    const treeIds = service?.treeIds || [];
    const tree = trees.find(t => treeIds.includes(t.id));
    return tree?.cliente_id === c.id;
  });

  const serviceTrees = trees.filter(t => service?.treeIds?.includes(t.id));
  
  // Coletar todos os anexos de todas as árvores deste serviço com seus respectivos treeIds
  const allAttachments: any[] = [];
  if (service.attachmentsByTree) {
    Object.entries(service.attachmentsByTree).forEach(([treeId, attachments]: any) => {
      if (Array.isArray(attachments)) {
        attachments.forEach((att: any) => {
          allAttachments.push({ ...att, treeId });
        });
      }
    });
  }

  const photos = allAttachments.filter(a => a.type === 'image');
  const docs = allAttachments.filter(a => a.type === 'pdf');

  const handleRenameClick = (item: any) => {
    setRenamingItem(item);
    setNewName(item.name || '');
  };

  const handleDeleteClick = (item: any) => {
    setDeletingItem(item);
  };

  const confirmRename = async () => {
    if (!renamingItem || !newName.trim()) return;
    setIsRenaming(true);
    try {
      await renameAttachment(service.id, renamingItem.treeId, renamingItem.id, newName.trim());
      setRenamingItem(null);
    } catch (e) {
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
                    <p className="text-[10px] text-slate-400">ID: {tree.id.slice(0, 8)}</p>
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
                          onClick={(e) => { e.stopPropagation(); setViewingAttachment(photo); }}
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
                    onClick={() => setViewingAttachment(doc)}
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
                      onClick={() => setViewingAttachment(doc)}
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
      {viewingAttachment && (
        <AttachmentViewer 
          attachment={viewingAttachment} 
          onClose={() => setViewingAttachment(null)} 
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

