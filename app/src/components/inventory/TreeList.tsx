import { useState, useMemo } from 'react';
import { Search, ArrowDownWideNarrow, ListFilter, History } from 'lucide-react';
import { useAppStore, type Tree } from '../../store/useAppStore';

type SortOption = 'recentes' | 'altura' | 'risco';
type GroupOption = 'nenhum' | 'especie' | 'risco' | 'proprietario';

export function TreeList() {
  const { trees, clients, hoveredTreeId, selectedTreeIds, setHoveredTreeId, toggleTreeSelection, mapBounds } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recentes');
  const [groupBy, setGroupBy] = useState<GroupOption>('nenhum');

  const riskOrder = { critico: 4, alto: 3, medio: 2, baixo: 1 };

  // 1. Filtrar -> 2. Ordenar -> 3. Agrupar
  const processedTrees = useMemo(() => {
    let filtered = trees.filter(t => 
      t.especie.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (mapBounds) {
      // Adicionamos uma pequena margem (0.0001 graus) para garantir que ícones na borda exata não sumam
      const padding = 0.0001;
      filtered = filtered.filter(t => 
        t.latitude >= (mapBounds.south - padding) && 
        t.latitude <= (mapBounds.north + padding) && 
        t.longitude >= (mapBounds.west - padding) && 
        t.longitude <= (mapBounds.east + padding)
      );
    }

    filtered = filtered.sort((a, b) => {
      if (sortBy === 'recentes') return new Date(b.data_cadastro).getTime() - new Date(a.data_cadastro).getTime();
      if (sortBy === 'altura') return b.altura - a.altura;
      if (sortBy === 'risco') return riskOrder[b.status_risco] - riskOrder[a.status_risco];
      return 0;
    });

    if (groupBy === 'nenhum') {
      return { 'Todas as Árvores': filtered };
    }

    return filtered.reduce((acc, tree) => {
      let key = 'Sem Grupo';
      if (groupBy === 'especie') key = tree.especie;
      if (groupBy === 'risco') key = tree.status_risco;
      if (groupBy === 'proprietario') {
        const client = clients.find(c => c.id === tree.cliente_id);
        key = client ? client.nome : 'Sem Proprietário';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(tree);
      return acc;
    }, {} as Record<string, Tree[]>);

  }, [trees, searchTerm, sortBy, groupBy, mapBounds]);

  if (trees.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <span className="block mb-2 text-3xl">🍃</span>
        <p className="text-sm">Nenhuma árvore cadastrada ainda.</p>
        <p className="text-xs mt-1">Clique em "Nova Árvore" para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      {/* Barra de Filtros e Controles */}
      <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por espécie..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="flex gap-2 text-xs">
          <div className="flex-1 flex items-center gap-2 bg-white px-2 py-1.5 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
            <ArrowDownWideNarrow size={14} className="text-primary" />
            <select 
              className="bg-transparent outline-none w-full text-slate-600 font-medium cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="recentes">Mais Recentes</option>
              <option value="altura">Maior Altura</option>
              <option value="risco">Maior Risco</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-center gap-2 bg-white px-2 py-1.5 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
            <ListFilter size={14} className="text-primary" />
            <select 
              className="bg-transparent outline-none w-full text-slate-600 font-medium cursor-pointer"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupOption)}
            >
              <option value="nenhum">Sem Grupo</option>
              <option value="risco">Por Risco</option>
              <option value="especie">Por Espécie</option>
              <option value="proprietario">Por Proprietário</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista Paginada/Agrupada */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 pb-2">
        {Object.entries(processedTrees).map(([groupName, groupTrees]) => (
          <div key={groupName} className="flex flex-col gap-3">
            {groupBy !== 'nenhum' && groupTrees.length > 0 && (
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 border-b border-slate-100 pb-1">
                {groupName} ({groupTrees.length})
              </h3>
            )}
            
            {groupTrees.map((tree) => {
              const isSelected = selectedTreeIds.includes(tree.id);
              const isHovered = hoveredTreeId === tree.id;
              const isInactive = tree.ativo === false;

              return (
                <div 
                  key={tree.id}
                  onClick={() => toggleTreeSelection(tree.id)}
                  onMouseEnter={() => setHoveredTreeId(tree.id)}
                  onMouseLeave={() => setHoveredTreeId(null)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isInactive
                      ? 'border-slate-200 bg-slate-50 opacity-60 grayscale'
                      : isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' 
                        : isHovered
                          ? 'border-slate-300 bg-slate-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{tree.especie}</h4>
                    <div className="flex items-center gap-1.5">
                      {isInactive && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 tracking-wide">
                          Suprimida
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        tree.status_risco === 'baixo' ? 'bg-emerald-100 text-emerald-700' :
                        tree.status_risco === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                        tree.status_risco === 'alto' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tree.status_risco}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Altura: <strong className="text-slate-700">{tree.altura}m</strong></span>
                    <span>Copa: <strong className="text-slate-700">{tree.tamanho_copa}m</strong></span>
                  </div>

                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded tracking-wider">
                      {tree.codigo_v6 ? `ARB-${tree.codigo_v6.toString().padStart(3, '0')}` : `# ${tree.id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>


                  {isSelected && (
                    <div className="mt-3 animate-in fade-in duration-200">
                      {(() => {
                        const client = clients.find(c => c.id === tree.cliente_id);
                        return (
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] px-2 py-1 rounded-md font-medium shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            {client ? client.nome : 'Proprietário não informado'}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center animate-in slide-in-from-top-2 duration-200">
                      <div className="text-[10px] font-medium text-slate-400">
                        Registro: {new Date(tree.data_cadastro).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); useAppStore.getState().openTreeDetailsModal(tree.id); }}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                          title="Detalhes Completos"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          Detalhes
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); useAppStore.getState().openHistoryModal(tree.id); }}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          <History size={14} /> Histórico
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); useAppStore.getState().openEditModal(tree.id); }}
                          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          Editar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {Object.keys(processedTrees).length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">Nenhum resultado encontrado.</div>
        )}
      </div>
    </div>
  );
}
