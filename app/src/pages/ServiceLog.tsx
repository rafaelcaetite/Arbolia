import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Service } from '../store/useAppStore';
import { User, ChevronRight, Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { ExportLogModal } from '../components/inventory/ExportLogModal';
import { formatTreeId } from '../lib/treeUtils';
import { ServiceAcervoModal } from '../components/services/ServiceAcervoModal';
import { ServiceLogFilters } from '../components/services/ServiceLogFilters';

export function ServiceLog() {
  const { services, trees, clients, openServiceModal, userProfile, deleteService } = useAppStore();
  
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [serviceType, setServiceType] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const isDataLoading = trees.length === 0 || clients.length === 0;

  const getClientName = useCallback((svc: Service) => {
    const treeIds = svc?.treeIds || svc?.treeIds || [];
    if (!Array.isArray(treeIds) || treeIds.length === 0) return 'N/A';
    
    const tree = trees.find(t => treeIds.includes(t.id));
    if (!tree) return 'N/A';
    const client = clients.find(c => c.id === tree.cliente_id);
    return String(client?.nome || 'N/A');
  }, [trees, clients]);

  const getTreesSummary = useCallback((svc: Service) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const treeIds: string[] = svc?.treeIds || (svc as any)?.treeIds || [];
    if (!Array.isArray(treeIds) || treeIds.length === 0) return 'N/A';
    
    const svcTrees = trees.filter(t => treeIds.includes(t.id));
    if (svcTrees.length === 0) {
      return treeIds.length === 1 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? `Árvore ${formatTreeId(treeIds[0] as any)}`
        : `${treeIds.length} árvores (Carregando...)`;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (svcTrees.length === 1) return `${svcTrees[0].especie} (${formatTreeId(svcTrees[0] as any)})`;
    return `${svcTrees[0].especie} + ${svcTrees.length - 1} outras`;
  }, [trees]);

  const filteredServices = useMemo(() => {
    return services.filter(svc => {
      const treeIds = svc?.treeIds || [];
      const client = clients.find(c => treeIds.some(tId => trees.find(t => t.id === tId)?.cliente_id === c.id));
      const clientName = client?.nome?.toLowerCase() || '';
      const responsible = svc?.responsavel?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = clientName.includes(search) || 
                            responsible.includes(search) || 
                            svc?.id?.toLowerCase().includes(search);

      const matchesType = serviceType === 'Todos' || svc.tipo === serviceType;
      const matchesStatus = statusFilter === 'Todos' || svc.status === statusFilter;

      const svcDate = new Date(svc.data + 'T00:00:00');
      const matchesDateStart = !dateStart || svcDate >= new Date(dateStart + 'T00:00:00');
      const matchesDateEnd = !dateEnd || svcDate <= new Date(dateEnd + 'T00:00:00');

      return matchesSearch && matchesType && matchesStatus && matchesDateStart && matchesDateEnd;
    }).sort((a, b) => new Date(b.data + 'T00:00:00').getTime() - new Date(a.data + 'T00:00:00').getTime());
  }, [services, trees, clients, searchTerm, serviceType, statusFilter, dateStart, dateEnd]);
  
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

  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

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
  }, [filteredServices, sortConfig, getClientName, getTreesSummary]);

  const groupedServices = useMemo(() => {
    if (sortConfig.field !== 'data') {
      const label = sortConfig.field === 'cliente' ? 'Clientes' : 
                    sortConfig.field === 'arvores' ? 'Árvores' : 
                    sortConfig.field === 'status' ? 'Status' : sortConfig.field;
      return [{ key: 'all', label: `Ordenado por ${label} (${sortConfig.direction === 'asc' ? 'Crescente' : 'Decrescente'})`, services: sortedServices }];
    }

    const groups: { [key: string]: (Service & { groupLabel: string })[] } = {};
    
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

  const [viewingService, setViewingService] = useState<Service | null>(null);
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
      {viewingService && (
        <ServiceAcervoModal 
          service={viewingService} 
          onClose={() => setViewingService(null)} 
        />
      )}

      {isExportModalOpen && (
        <ExportLogModal 
          onClose={() => setIsExportModalOpen(false)}
          services={services}
          trees={trees}
          clients={clients}
        />
      )}

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
                    console.error(err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Log de Atendimentos</h1>
          <p className="text-slate-500 text-xs">Histórico global de todos os serviços e auditoria do sistema.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleExportClick}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={15} />
            Exportar
          </button>
        </div>
      </div>

      <ServiceLogFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        serviceType={serviceType}
        setServiceType={setServiceType}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateStart={dateStart}
        setDateStart={setDateStart}
        dateEnd={dateEnd}
        setDateEnd={setDateEnd}
      />

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
