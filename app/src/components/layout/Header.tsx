import { Bell, Search, CloudRain, Navigation } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect } from 'react';

export function Header() {
  const { weatherCity, userProfile } = useAppStore();
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallbacks para quando o perfil ainda não carregou
  const displayName = userProfile?.nome || 'Técnico';
  const displayRole = userProfile?.role === 'admin' ? 'Administrador' : userProfile?.role === 'tecnico' ? 'Engenheiro Técnico' : 'Agente de Campo';
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

        <div className="flex items-center gap-3 pl-6 border-l border-slate-100 cursor-pointer hover:opacity-80 transition-opacity">
          {userProfile?.foto_url ? (
            <img src={userProfile.foto_url} alt={displayName} className="w-10 h-10 rounded-full border border-primary/20 shadow-sm object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
              {displayInitial}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">{displayName}</span>
            <span className="text-xs text-slate-500">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
