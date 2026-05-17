import { useState, useMemo } from 'react';
import { X, FileText, Download, Calendar, Users, Filter, CheckCircle } from 'lucide-react';
import { useAppStore, type Service, type Tree, type Client } from '../../store/useAppStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportLogModalProps {
  onClose: () => void;
  services: Service[];
  trees: Tree[];
  clients: Client[];
}

export function ExportLogModal({ onClose, services, trees, clients }: ExportLogModalProps) {
  const { employees } = useAppStore();
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>(''); // YYYY-MM-DD

  // Extrair anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    services.forEach(svc => {
      if (svc.data) {
        years.add(svc.data.split('-')[0]);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Descendente
  }, [services]);

  const getClientName = (svc: Service) => {
    const treeIds = svc?.treeIds || (svc as any)?.tree_ids || [];
    if (!Array.isArray(treeIds) || treeIds.length === 0) return 'N/A';
    
    const tree = trees.find(t => treeIds.includes(t.id));
    if (!tree) return 'N/A';
    const client = clients.find(c => c.id === tree.cliente_id);
    return String(client?.nome || 'N/A');
  };

  const getClientFilterName = (clientId: string) => {
    if (clientId === 'all') return 'Todos os Clientes';
    return clients.find(c => c.id === clientId)?.nome || 'Desconhecido';
  };

  const getTechCrea = (techName: string) => {
    if (!techName || techName === 'Não atribuído') return 'N/A';
    const emp = employees.find(e => e.nome === techName);
    return emp?.crea || 'N/A';
  };

  const handleExport = () => {
    // 1. Aplicar Filtros
    let filtered = [...services];

    if (filterClientId !== 'all') {
      filtered = filtered.filter(svc => {
        const treeIds = svc.treeIds || (svc as any).tree_ids || [];
        const svcClientIds = treeIds
          .map(tId => trees.find(t => t.id === tId)?.cliente_id)
          .filter(Boolean);
        return svcClientIds.includes(filterClientId);
      });
    }

    if (filterDay) {
      filtered = filtered.filter(svc => svc.data === filterDay);
    } else {
      if (filterYear !== 'all') {
        filtered = filtered.filter(svc => svc.data?.startsWith(filterYear));
      }
      if (filterMonth !== 'all') {
        filtered = filtered.filter(svc => {
          if (!svc.data) return false;
          const [, month] = svc.data.split('-');
          return month === filterMonth;
        });
      }
    }

    // Ordenar decrescente
    filtered.sort((a, b) => new Date(b.data + 'T00:00:00').getTime() - new Date(a.data + 'T00:00:00').getTime());

    if (filtered.length === 0) {
      alert("Nenhum serviço encontrado para estes filtros.");
      return;
    }

    // 2. Exportar
    if (selectedFormat === 'csv') {
      exportToCSV(filtered);
    } else {
      exportToPDF(filtered);
    }
    
    onClose();
  };

  const exportToCSV = (data: Service[]) => {
    const headers = ['ID', 'Data', 'Horário', 'Cliente', 'Árvores', 'Tipo de Serviço', 'Responsável', 'CREA', 'Status'];
    
    const rows = data.map(svc => {
      const treeIds = svc.treeIds || (svc as any).tree_ids || [];
      const svcTrees = trees.filter(t => treeIds.includes(t.id));
      const treeSummary = svcTrees.length === 0 
        ? 'N/A' 
        : svcTrees.length === 1 
          ? svcTrees[0].especie 
          : `${svcTrees[0].especie} + ${svcTrees.length - 1} outras`;

      return [
        svc.id,
        new Date(svc.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        svc.horario ? svc.horario.slice(0, 5) : 'N/D',
        getClientName(svc),
        treeSummary.replace(/;/g, ''),
        svc.tipo,
        svc.responsavel,
        getTechCrea(svc.responsavel),
        svc.status
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `arbolia_servicos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (data: Service[]) => {
    const doc = new jsPDF('landscape');
    
    // Cores Arbolia (Brand)
    const primaryColor = [16, 185, 129]; // emerald-500
    
    // Configurações Globais
    doc.setFont("helvetica");

    // Título do Relatório
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Relatório de Atendimentos', 14, 22);
    
    // Subtítulo e Metadados
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    const filterText = filterClientId !== 'all' ? `Cliente: ${getClientFilterName(filterClientId)}` : 'Todos os clientes';
    const dateText = filterDay ? `Dia: ${new Date(filterDay + 'T00:00:00').toLocaleDateString('pt-BR')}` : `Período: ${filterMonth !== 'all' ? filterMonth + '/' : ''}${filterYear !== 'all' ? filterYear : 'Todo o período'}`;
    doc.text(`${filterText} | ${dateText} | Total de registros: ${data.length}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    // Linha decorativa
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 40, doc.internal.pageSize.width - 14, 40);

    // Corpo da Tabela
    const tableData = data.map(svc => {
      const treeIds = svc.treeIds || (svc as any).tree_ids || [];
      const svcTrees = trees.filter(t => treeIds.includes(t.id));
      const treeSummary = svcTrees.length === 0 
        ? 'N/A' 
        : svcTrees.length === 1 
          ? `${svcTrees[0].especie} (#${svcTrees[0].id.slice(0, 8).toUpperCase()})` 
          : `${svcTrees[0].especie} (#${svcTrees[0].id.slice(0, 8).toUpperCase()}) + ${svcTrees.length - 1} outras`;

      return [
        svc.id.slice(0, 8).toUpperCase(),
        new Date(svc.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        svc.horario ? svc.horario.slice(0, 5) : 'N/D',
        getClientName(svc),
        treeSummary,
        svc.tipo,
        svc.status.toUpperCase(),
        svc.responsavel || 'N/A',
        getTechCrea(svc.responsavel)
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Data', 'Horário', 'Cliente', 'Árvores', 'Tipo', 'Status', 'Responsável', 'CREA']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor as [number, number, number],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      styles: {
        cellPadding: 4,
        font: 'helvetica'
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { cellWidth: 24 },
        2: { cellWidth: 22 },
        3: { cellWidth: 40 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 22 },
        6: { cellWidth: 28 }, // Mais larga para status
        7: { cellWidth: 35 },
        8: { cellWidth: 20 }
      }
    });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Arbolia © ${new Date().getFullYear()} - Sistema de Gestão de Árvores | Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`arbolia_relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow-2xl z-[210] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50/80 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Download className="text-primary" size={24} /> Exportar Relatório
            </h2>
            <p className="text-slate-500 text-xs mt-1">Gere extrações consolidadas do histórico de atendimentos.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          
          {/* Format Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><FileText size={14} /> 1. Formato do Arquivo</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedFormat('pdf')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFormat === 'pdf' 
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'pdf' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <FileText size={20} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold ${selectedFormat === 'pdf' ? 'text-primary' : 'text-slate-700'}`}>Relatório PDF</span>
                  <span className="text-[10px] text-slate-500 font-medium">Design moderno para impressão</span>
                </div>
                {selectedFormat === 'pdf' && <CheckCircle size={16} className="text-primary ml-auto" />}
              </button>

              <button 
                onClick={() => setSelectedFormat('csv')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFormat === 'csv' 
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedFormat === 'csv' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Filter size={20} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold ${selectedFormat === 'csv' ? 'text-blue-600' : 'text-slate-700'}`}>Planilha CSV</span>
                  <span className="text-[10px] text-slate-500 font-medium">Dados brutos para Excel/BI</span>
                </div>
                {selectedFormat === 'csv' && <CheckCircle size={16} className="text-blue-500 ml-auto" />}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 border-t border-slate-100 pt-6"><Filter size={14} /> 2. Filtros de Extração</label>
            
            <div className="space-y-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
              
              {/* Cliente */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Users size={12} /> Cliente</label>
                <select
                  value={filterClientId}
                  onChange={(e) => setFilterClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="all">Todos os Clientes</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.documento})</option>
                  ))}
                </select>
              </div>

              {/* Data: Especifico ou Mes/Ano */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><Calendar size={12} /> Dia Específico</label>
                  <input
                    type="date"
                    value={filterDay}
                    onChange={(e) => {
                      setFilterDay(e.target.value);
                      if (e.target.value) {
                        setFilterMonth('all');
                        setFilterYear('all');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1 text-transparent select-none"><Calendar size={12} /> Mês</label>
                    <select
                      value={filterMonth}
                      disabled={!!filterDay}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    >
                      <option value="all">Todos os Meses</option>
                      {Array.from({length: 12}).map((_, i) => (
                        <option key={i} value={String(i+1).padStart(2, '0')}>
                          {new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 w-24">
                    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1 text-transparent select-none"><Calendar size={12} /> Ano</label>
                    <select
                      value={filterYear}
                      disabled={!!filterDay}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    >
                      <option value="all">Ano</option>
                      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {!!filterDay && <p className="text-[10px] text-orange-500 font-medium">Filtros de mês/ano desativados enquanto um dia específico estiver selecionado.</p>}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleExport}
            className={`px-8 py-2.5 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 text-sm flex items-center gap-2 ${
              selectedFormat === 'pdf' 
                ? 'bg-primary hover:bg-primary-dark shadow-primary/20'
                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
            }`}
          >
            <Download size={16} /> Gerar {selectedFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </>
  );
}
