import { Bell, Search, CloudRain, Navigation } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect } from 'react';

export function Header() {
  const { weatherCity, userProfile, openProfileModal } = useAppStore();
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallbacks para quando o perfil ainda não carregou
  const displayName = userProfile?.nome || 'Técnico';
  const displayInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const fetchCurrentWeather = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherCity.lat}&longitude=${weatherCity.lon}&current_weather=true&timezone=auto`);
        const data = await res.json();
        setCurrentTemp(Math.round(data.current_weather.temperature));
      } catch (e) {
        console.error('Erro ao buscar clima no Header:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentWeather();
  }, [weatherCity]);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Bom dia, {displayName.split(' ')[0]} 👋</h1>
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
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar árvore ou cliente..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 group-focus-within:w-80 shadow-inner"
          />
        </div>
        
        <button className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

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
            {userProfile?.foto_url ? (
              <img 
                src={userProfile.foto_url} 
                alt={userProfile.nome} 
                className="w-11 h-11 rounded-[14px] object-cover border-2 border-white shadow-md ring-1 ring-slate-100 group-hover:ring-primary/30 transition-all"
              />
            ) : (
              <div className="w-11 h-11 rounded-[14px] bg-primary text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition-transform">
                {displayInitial}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
