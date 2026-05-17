import { Bell, Search, CloudRain, Navigation, CheckCircle, AlertTriangle, Info, Clock, Check, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecureImage } from '../common/SecureImage';

export function Header() {
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
    openTreeDetailsModal
  } = useAppStore();
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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
          subtitle: `Risco: ${t.status_risco ? t.status_risco.toUpperCase() : 'N/A'} · ID: #${t.id.slice(0, 8).toUpperCase()}`,
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
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-[150]">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">{greeting}, {displayName.split(' ')[0]} 👋</h1>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm transition-all hover:bg-slate-100/80">
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

      <div className="flex items-center gap-6">
        <div className="relative" ref={searchRef}>
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
          className="flex items-center gap-3 pl-4 border-l border-slate-100 group cursor-pointer hover:bg-slate-50 py-2 px-3 rounded-2xl transition-all active:scale-95"
        >
          <div className="flex flex-col items-end mr-1">
            <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">{userProfile?.nome}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {userProfile?.role === 'admin' ? 'Administrador' : userProfile?.role === 'tecnico' ? 'Engenheiro' : 'Técnico de Campo'}
            </span>
          </div>
          
          <div className="relative">
            <SecureImage 
              src={userProfile?.foto_url}
              alt={userProfile?.nome || ''}
              className="w-11 h-11 rounded-[14px] border-2 border-white shadow-md ring-1 ring-slate-100 group-hover:ring-primary/30 transition-all"
              fallbackInitial={displayInitial}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
