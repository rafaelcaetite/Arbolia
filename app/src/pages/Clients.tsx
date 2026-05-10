import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ArrowDownWideNarrow, ListFilter, Trees, Building2, Phone, Mail, FileText, Info, X, Calendar, Leaf, Download, Pencil } from 'lucide-react';
import { useAppStore, type Tree, type Service, type ServiceAttachment } from '../store/useAppStore';
import { ClientDetailsModal } from '../components/clients/ClientDetailsModal';

const MOCK_CLIENTS = [
  { id: 'client-1', nome: 'Prefeitura de São Paulo', documento: '46.395.000/0001-39', email: 'contato@prefeitura.sp.gov.br', telefone: '(11) 156', data_cadastro: '2025-01-15T10:00:00.000Z', status: 'ativo' },
  { id: 'client-2', nome: 'Condomínio Reserva da Mata', documento: '12.345.678/0001-99', email: 'sindico@reservadamata.com', telefone: '(11) 98765-4321', data_cadastro: '2025-11-20T14:30:00.000Z', status: 'ativo' },
  { id: 'client-3', nome: 'Empresa GreenTech', documento: '98.765.432/0001-11', email: 'facilities@greentech.br', telefone: '(11) 3333-4444', data_cadastro: '2026-02-10T09:15:00.000Z', status: 'inativo' }
];

type SortOption = 'recentes' | 'nome';
type GroupOption = 'nenhum' | 'status';
type PopoverType = 'trees' | 'services' | 'docs' | null;

// ── Popover flutuante ────────────────────────────────────────────────────────
function ClientPopover({ type, trees, services, docs, onClose }: {
  type: PopoverType;
  trees: Tree[];
  services: Service[];
  docs: ServiceAttachment[];
  onClose: () => void;
}) {
  if (!type) return null;

  return (
    <>
      {/* Overlay transparente para fechar */}
      <div className="fixed inset-0 z-[150]" onClick={onClose} />

      <div className="absolute bottom-full left-0 mb-2 z-[160] w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            {type === 'trees'
              ? <><Leaf size={12} className="text-primary" /> Árvores vinculadas</>
              : type === 'docs'
              ? <><FileText size={12} className="text-blue-500" /> Documentos</>
              : <><Calendar size={12} className="text-orange-500" /> Agendamentos pendentes</>}
          </span>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-3 max-h-64 overflow-y-auto flex flex-col gap-2">
          {type === 'trees' && (
            trees.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Nenhuma árvore cadastrada.</p>
              : trees.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">{t.especie}</span>
                    <span className="text-[9px] font-mono text-slate-400"># {t.id.slice(0,8).toUpperCase()}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                    t.status_risco === 'baixo' ? 'bg-emerald-100 text-emerald-700' :
                    t.status_risco === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                    t.status_risco === 'alto'  ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>{t.status_risco}</span>
                </div>
              ))
          )}

          {type === 'services' && (
            services.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Nenhum agendamento pendente.</p>
              : services.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-700">{s.tipo}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {s.horario && ` às ${s.horario}`}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {s.status}
                  </span>
                </div>
              ))
          )}
          {type === 'docs' && (
            docs.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Nenhum documento vinculado.</p>
              : docs.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={12} className="text-blue-500 shrink-0" />
                    <span className="text-[10px] font-medium text-slate-600 truncate">{d.name}</span>
                  </div>
                  <button
                    onClick={() => { const a = document.createElement('a'); a.href = d.dataUrl; a.download = d.name; a.click(); }}
                    className="shrink-0 p-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <Download size={11} />
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </>
  );
}

// ── Card de Cliente com Popover ──────────────────────────────────────────────
function ClientCard({ client, clientTrees, clientServices, clientDocs, onOpenDetails }: {
  client: any;
  clientTrees: Tree[];
  clientServices: Service[];
  clientDocs: any[];
  onOpenDetails: () => void;
}) {
  const [popover, setPopover] = useState<PopoverType>(null);

  const toggle = (type: 'trees' | 'services' | 'docs') => {
    setPopover(prev => prev === type ? null : type);
  };

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all group flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h4 className="font-bold text-slate-800 text-base leading-tight group-hover:text-primary transition-colors">{client.nome}</h4>
          <span className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
            <FileText size={12} /> {client.documento}
          </span>
        </div>
        {/* Status + Editar + Detalhes */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
            client.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {client.status}
          </span>
          <button
            title="Editar dados"
            className="p-1 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/8 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onOpenDetails}
            title="Detalhes"
            className="p-1 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/8 transition-colors"
          >
            <Info size={13} />
          </button>
        </div>
      </div>

      {/* Contato */}
      <div className="flex flex-col gap-2.5 text-xs text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
        <p className="flex items-center gap-2 m-0"><Mail size={14} className="text-slate-400" /> {client.email}</p>
        <p className="flex items-center gap-2 m-0"><Phone size={14} className="text-slate-400" /> {client.telefone}</p>
      </div>

      {/* Footer — só badges */}
      <div className="mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 relative flex-wrap">
          {/* Badge Árvores */}
          <button
            onClick={() => toggle('trees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              popover === 'trees'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <Trees size={13} />
            {clientTrees.length} {clientTrees.length === 1 ? 'Árvore' : 'Árvores'}
          </button>

          {/* Badge Agendamentos */}
          {clientServices.length > 0 && (
            <button
              onClick={() => toggle('services')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                popover === 'services'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100'
              }`}
            >
              <Calendar size={13} />
              {clientServices.length} Agendado{clientServices.length !== 1 ? 's' : ''}
            </button>
          )}

          {/* Badge Documentos */}
          {clientDocs.length > 0 && (
            <button
              onClick={() => toggle('docs')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                popover === 'docs'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
              }`}
            >
              <FileText size={13} />
              {clientDocs.length} {clientDocs.length === 1 ? 'Documento' : 'Documentos'}
            </button>
          )}

          {/* Popover */}
          <ClientPopover
            type={popover}
            trees={clientTrees}
            services={clientServices}
            docs={clientDocs}
            onClose={() => setPopover(null)}
          />
        </div>
      </div>
    </div>
  );
}


export function Clients() {
  const { clients, setClients, trees, services, openClientDetailsModal } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recentes');
  const [groupBy, setGroupBy] = useState<GroupOption>('nenhum');

  useEffect(() => {
    if (clients.length === 0) setClients(MOCK_CLIENTS as any);
  }, []);

  const processedClients = useMemo(() => {
    let filtered = clients.filter(c => 
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.documento.includes(searchTerm)
    );

    filtered = filtered.sort((a, b) => {
      if (sortBy === 'recentes') return new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime();
      if (sortBy === 'nome') return a.nome.localeCompare(b.nome);
      return 0;
    });

    if (groupBy === 'nenhum') {
      return { 'Todos os Clientes': filtered };
    }

    return filtered.reduce((acc, client) => {
      const key = client.status;
      if (!acc[key]) acc[key] = [];
      acc[key].push(client);
      return acc;
    }, {} as Record<string, typeof clients>);

  }, [clients, searchTerm, sortBy, groupBy]);

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <ClientDetailsModal />
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="text-primary" /> Carteira de Clientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os proprietários e contratantes do inventário.</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-95">
          + Novo Cliente
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente por nome ou documento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm hover:border-primary/50 transition-colors">
            <ArrowDownWideNarrow size={16} className="text-primary" />
            <select 
              className="bg-transparent outline-none text-sm text-slate-600 font-medium cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="recentes">Mais Recentes</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm hover:border-primary/50 transition-colors">
            <ListFilter size={16} className="text-primary" />
            <select 
              className="bg-transparent outline-none text-sm text-slate-600 font-medium cursor-pointer"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupOption)}
            >
              <option value="nenhum">Sem Grupo</option>
              <option value="status">Por Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-6 pr-2">
        <div className="flex flex-col gap-6">
          {Object.entries(processedClients).map(([groupName, groupClients]) => (
            <div key={groupName} className="flex flex-col gap-4">
              {groupBy !== 'nenhum' && groupClients.length > 0 && (
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 border-b border-slate-200 pb-2">
                  Status: {groupName} ({groupClients.length})
                </h3>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {groupClients.map((client) => {
                  const clientTrees = trees.filter(t => t.cliente_id === client.id);
                  const clientTreeIds = clientTrees.map(t => t.id);
                  const clientServices = services.filter(s =>
                    s.status !== 'concluido' &&
                    s.treeIds.some(tid => clientTreeIds.includes(tid))
                  );
                  // PDFs exclusivos de cada árvore do cliente (máx 5 mais recentes)
                  const clientDocs = services
                    .filter(s => s.treeIds.some(tid => clientTreeIds.includes(tid)) && s.attachmentsByTree)
                    .flatMap(s =>
                      clientTreeIds.flatMap(tid => (s.attachmentsByTree?.[tid] ?? []).filter(a => a.type === 'pdf'))
                    )
                    .slice(-5)
                    .reverse();

                  return (
                    <ClientCard
                      key={client.id}
                      client={client}
                      clientTrees={clientTrees}
                      clientServices={clientServices}
                      clientDocs={clientDocs}
                      onOpenDetails={() => openClientDetailsModal(client.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(processedClients).length === 0 && (
            <div className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
