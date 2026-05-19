import { Bell, Search, CloudRain, Navigation, CheckCircle, AlertTriangle, Info, Clock, Check, X, History, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecureImage } from '../common/SecureImage';
import { formatTreeId } from '../../lib/treeUtils';

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { 
    weatherCity, 
    userProfile, 
    openProfileModal, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    addWeatherNotification, 
    deleteNotification,
    clients,
    trees,
    services,
    openClientDetailsModal,
    openTreeDetailsModal,
    auditLogs,
    fetchAuditLogs
  } = useAppStore();
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  
  const auditLogRef = useRef<HTMLDivElement>(null);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchDate = filterDate ? log.created_at.startsWith(filterDate) : true;
      const matchEmp = filterEmployee ? log.user_name === filterEmployee : true;
      return matchDate && matchEmp;
    });
  }, [auditLogs, filterDate, filterEmployee]);

  const visibleAuditLogs = filteredAuditLogs.slice(0, visibleCount);

  const auditEmployees = useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.user_name))).sort();
  }, [auditLogs]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [userProfile?.role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (auditLogRef.current && !auditLogRef.current.contains(event.target as Node)) {
        setIsAuditLogOpen(false);
        setExpandedLogId(null);
      }
    }
    if (isAuditLogOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAuditLogOpen]);

  // Fallbacks para quando o perfil ainda não carregou
  const displayName = userProfile?.nome || 'Técnico';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const unreadCount = notifications.filter(n => !n.lida).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    const fetchCurrentWeather = async () => {
      setIsLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${weatherCity.lat}&longitude=${weatherCity.lon}&current_weather=true&timezone=auto`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        if (data.current_weather) {
          setCurrentTemp(Math.round(data.current_weather.temperature));
          addWeatherNotification(data.current_weather);
        }
      } catch (e) {
        console.error('Erro ao buscar clima no Header:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentWeather();
  }, [weatherCity]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fechar busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  interface SearchResult {
    id: string;
    type: 'cliente' | 'arvore' | 'documento';
    title: string;
    subtitle: string;
    badge: string;
    badgeClass: string;
    onClick: () => void;
  }

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    // 1. Pesquisa Clientes
    clients.forEach(c => {
      if (c.nome.toLowerCase().includes(q) || c.documento.includes(q)) {
        results.push({
          id: c.id,
          type: 'cliente',
          title: c.nome,
          subtitle: `Documento: ${c.documento}`,
          badge: 'Cliente',
          badgeClass: 'bg-blue-100 text-blue-700',
          onClick: () => {
            navigate('/clientes');
            setTimeout(() => {
              openClientDetailsModal(c.id);
            }, 100);
          }
        });
      }
    });

    // 2. Pesquisa Árvores
    trees.forEach(t => {
      if (t.especie.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) {
        results.push({
          id: t.id,
          type: 'arvore',
          title: t.especie,
          subtitle: `Risco: ${t.status_risco ? t.status_risco.toUpperCase() : 'N/A'} · ID: ${formatTreeId(t)}`,
          badge: 'Árvore',
          badgeClass: 'bg-emerald-100 text-emerald-700',
          onClick: () => {
            navigate('/inventario');
            setTimeout(() => {
              openTreeDetailsModal(t.id);
            }, 100);
          }
        });
      }
    });

    // 3. Pesquisa Documentos (PDF/Imagem)
    services.forEach(svc => {
      if (!svc.attachmentsByTree) return;
      Object.entries(svc.attachmentsByTree).forEach(([treeId, atts]) => {
        if (!atts?.length) return;
        const tree = trees.find(t => t.id === treeId);
        atts.forEach(att => {
          if (att.name.toLowerCase().includes(q)) {
            results.push({
              id: att.id,
              type: 'documento',
              title: att.name,
              subtitle: `Anexo de ${tree?.especie ?? 'Árvore'} · Serviço: ${svc.tipo}`,
              badge: att.type === 'pdf' ? 'PDF' : 'Imagem',
              badgeClass: att.type === 'pdf' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700',
              onClick: () => {
                navigate(`/acervo?search=${encodeURIComponent(att.name)}`);
              }
            });
          }
        });
      });
    });

    return results.slice(0, 8); // Limita em 8 resultados sugeridos
  }, [searchQuery, clients, trees, services, navigate, openClientDetailsModal, openTreeDetailsModal]);

  const currentHour = new Date().getHours();
  let greeting = 'Bom dia';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
  }

  return (
    <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[30]">
      <div className="flex items-center gap-3 md:gap-4">
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 hidden sm:block">{greeting}, {displayName.split(' ')[0]} 👋</h1>
        <div className="hidden md:block h-8 w-px bg-slate-200 mx-2"></div>
        <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm transition-all hover:bg-slate-100/80">
          <div className="flex items-center gap-1.5 text-blue-500">
            <CloudRain size={14} className="animate-pulse" />
            <span>{isLoading ? '--' : `${currentTemp}°C`}</span>
          </div>
          <div className="w-px h-3 bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Navigation size={12} />
            <span className="truncate max-w-[120px]">{weatherCity.name}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente, árvore ou documento..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 focus:w-80 shadow-inner"
          />

          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 mt-2 w-80 sm:w-[480px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resultados Sugeridos</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{searchResults.length} encontrados</span>
              </div>
              
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        result.onClick();
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-xs font-bold text-slate-700 truncate">{result.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 truncate">{result.subtitle}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${result.badgeClass} shrink-0`}>
                        {result.badge}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <span>Nenhum resultado correspondente</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {userProfile?.role === 'admin' && (
          <div className="relative" ref={auditLogRef}>
            <button 
              onClick={() => setIsAuditLogOpen(!isAuditLogOpen)}
              className={`relative p-2 rounded-full transition-colors ${isAuditLogOpen ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
              title="Log de Alterações"
            >
              <History size={20} />
            </button>

            {isAuditLogOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <History size={16} className="text-primary" />
                      Histórico
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="text-[10px] px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-primary flex-1"
                    />
                    <select
                      value={filterEmployee}
                      onChange={(e) => setFilterEmployee(e.target.value)}
                      className="text-[10px] px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-primary flex-1"
                    >
                      <option value="">Todos usuários</option>
                      {auditEmployees.map(emp => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {visibleAuditLogs.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center text-slate-400">
                      <History size={32} className="mb-2 text-slate-300 opacity-50" />
                      <p className="text-sm font-medium">Nenhum log encontrado</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {visibleAuditLogs.map(log => (
                        <div 
                          key={log.id} 
                          onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          className="p-4 hover:bg-slate-50 transition-colors group flex gap-3 cursor-pointer"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs uppercase border border-slate-200 shadow-sm">
                              {log.user_name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="text-xs font-bold text-slate-800 truncate pr-2">
                                {log.user_name}
                              </h4>
                              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                              </span>
                            </div>
                            <div className="flex justify-between items-end gap-2">
                              <p className="text-[11px] text-slate-600 leading-snug">
                                <span className="font-semibold text-slate-700">{log.action === 'CREATE' ? 'Criou' : log.action === 'UPDATE' ? 'Editou' : 'Excluiu'}</span> {log.entity.toLowerCase()}: {log.details}
                              </p>
                              {log.payload && (
                                <div className="text-slate-400">
                                  {expandedLogId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                              )}
                            </div>
                            
                            {/* Expandable Payload Section */}
                            {expandedLogId === log.id && log.payload && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Object.entries(log.payload)
                                  .filter(([key, val]) => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && val !== undefined && val !== null)
                                  .map(([key, value]: [string, any]) => {
                                    const isDiffObj = value && typeof value === 'object' && ('old' in value || 'new' in value);
                                    const oldVal = isDiffObj ? value.old : undefined;
                                    const newVal = isDiffObj ? value.new : value;
                                    
                                    const formatVal = (v: any) => typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : typeof v === 'object' && v !== null ? JSON.stringify(v) : (String(v) || '-');

                                    return (
                                      <div key={key} className="bg-white border border-slate-100 rounded-md p-2 shadow-sm flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                          {key.replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex flex-col text-[11px] font-medium truncate">
                                          {oldVal !== undefined && oldVal !== null && (
                                            <span className="text-slate-400 line-through text-[9px] leading-tight truncate" title={String(oldVal)}>
                                              {formatVal(oldVal)}
                                            </span>
                                          )}
                                          <span className="text-slate-700 truncate" title={String(newVal)}>
                                            {formatVal(newVal)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {visibleCount < filteredAuditLogs.length && (
                        <div className="p-3 text-center border-t border-slate-50">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setVisibleCount(v => v + 5); }}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                          >
                            Ver mais
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                  >
                    <Check size={14} />
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle size={32} className="mb-2 text-slate-300 opacity-50" />
                    <p className="text-sm font-medium">Você não tem notificações</p>
                    <p className="text-xs mt-1">Tudo em dia no momento.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()).map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          // Here we could add navigation based on notif.acao
                          setIsNotificationsOpen(false);
                        }}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-3 ${!notif.lida ? 'bg-blue-50/30' : 'opacity-70'}`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {notif.tipo === 'critico' && <AlertTriangle size={18} className="text-red-500" />}
                          {notif.tipo === 'aviso' && <Clock size={18} className="text-amber-500" />}
                          {notif.tipo === 'recomendacao' && <Info size={18} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold truncate pr-2 ${!notif.lida ? 'text-slate-800' : 'text-slate-600'}`}>
                              {notif.titulo}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!notif.lida && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-0.5"></span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-1 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                title="Excluir notificação"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {notif.mensagem}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div 
          onClick={openProfileModal}
          className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-100 group cursor-pointer hover:bg-slate-50 py-1.5 md:py-2 px-1 md:px-3 rounded-2xl transition-all active:scale-95"
        >
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">{userProfile?.nome}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {userProfile?.role === 'admin' ? 'Administrador' : userProfile?.role === 'tecnico' ? 'Técnico' : 'Técnico de Campo'}
            </span>
          </div>
          
          <div className="relative">
            <SecureImage 
              src={userProfile?.foto_url}
              alt={userProfile?.nome || ''}
              className="w-10 h-10 md:w-11 md:h-11 rounded-[14px] border-2 border-white shadow-md ring-1 ring-slate-100 group-hover:ring-primary/30 transition-all"
              fallbackInitial={displayInitial}
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
