import React, { useState, useMemo } from 'react';

import { useAppStore } from '../store/useAppStore';
import { Search, FileText, User, ChevronRight, Download, Eye, ExternalLink, Pencil } from 'lucide-react';


export function ServiceLog() {
  const { services, trees, clients, openServiceModal } = useAppStore();
  
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
      const svcDate = new Date(svc.data);
      const matchesDateStart = !dateStart || svcDate >= new Date(dateStart);
      const matchesDateEnd = !dateEnd || svcDate <= new Date(dateEnd);

      return matchesSearch && matchesType && matchesStatus && matchesDateStart && matchesDateEnd;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
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

  const handleExportCSV = () => {

    // Cabeçalhos do CSV
    const headers = ['ID', 'Data', 'Horário', 'Cliente', 'Árvores', 'Tipo de Serviço', 'Responsável', 'Status'];
    
    // Mapear os serviços filtrados para linhas do CSV
    const rows = filteredServices.map(svc => [
      svc.id,
      new Date(svc.data + 'T00:00:00').toLocaleDateString(),
      svc.horario || 'N/D',
      getClientName(svc),
      getTreesSummary(svc).replace(/;/g, ''), // Limpeza básica para o delimitador
      svc.tipo,
      svc.responsavel,
      svc.status
    ]);

    // Unir com ponto e vírgula (delimitador padrão do Excel em PT-BR)
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Adicionar BOM para suporte a caracteres especiais no Excel
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `arbolia_historico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Log de Atendimentos</h1>
          <p className="text-slate-500 text-sm">Histórico global de todos os serviços e auditoria do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={16} />
            Exportar CSV
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                            <span className="text-[10px] text-slate-400">{svc.horario || 'Horário não def.'}</span>
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

                            {svc.laudoGerado && (
                              <button 
                                title="Ver Laudo"
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              >
                                <FileText size={16} />
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
  const { trees, clients } = useAppStore();
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const client = clients.find(c => {
    const treeIds = service?.treeIds || [];
    const tree = trees.find(t => treeIds.includes(t.id));
    return tree?.cliente_id === c.id;
  });

  const serviceTrees = trees.filter(t => service?.treeIds?.includes(t.id));
  
  // Coletar todos os anexos de todas as árvores deste serviço
  const allAttachments: any[] = [];
  if (service.attachmentsByTree) {
    Object.values(service.attachmentsByTree).forEach((attachments: any) => {
      if (Array.isArray(attachments)) {
        allAttachments.push(...attachments);
      }
    });
  }

  const photos = allAttachments.filter(a => a.type === 'image');
  const docs = allAttachments.filter(a => a.type === 'pdf');

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
            <p className="text-sm text-slate-500">
              {client?.nome || 'Cliente não identificado'} • {new Date(service.data + 'T00:00:00').toLocaleDateString()}
            </p>
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
                  <button 
                    key={photo.id}
                    onClick={() => setViewingImage(photo.dataUrl)}
                    className="aspect-square rounded-2xl overflow-hidden border border-slate-100 hover:ring-2 hover:ring-primary/20 transition-all group relative"
                  >
                    {photo.dataUrl && (
                      <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink size={20} className="text-white" />
                    </div>
                  </button>
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
              {service.laudoGerado && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between group hover:bg-emerald-100/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Laudo Técnico Oficial (PDF)</p>
                      <p className="text-[10px] text-emerald-600/70">Documento gerado automaticamente pelo Arbolia</p>
                    </div>
                  </div>
                  <Download size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
              )}
              
              {docs.map(doc => (
                <a 
                  key={doc.id}
                  href={doc.dataUrl}
                  download={doc.name}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">PDF • {(doc.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <Download size={18} className="text-slate-400 group-hover:scale-110 transition-transform" />
                </a>
              ))}

              {!service.laudoGerado && docs.length === 0 && (
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

      {/* Viewer de Imagem (Full Screen) */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setViewingImage(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <ChevronRight size={32} className="rotate-180" />
          </button>
          <img 
            src={viewingImage} 
            alt="Visualização" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300" 
          />
        </div>
      )}
    </div>
  );
}

