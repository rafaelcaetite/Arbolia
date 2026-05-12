import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { Trees, Users, AlertTriangle, CloudRain, Clock, CheckCircle2, Thermometer, Droplets, Wind, ShieldAlert, Navigation, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';

export function Home() {
  const { trees, clients, services, openPostServiceModal, weatherCity, setWeatherCity } = useAppStore();
  const navigate = useNavigate();

  // Estados locais para busca e UI
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [fiveDayForecast, setFiveDayForecast] = useState<any[]>([]);
  const [currentWeather, setCurrentWeather] = useState<{ temp: any, humidity: any, wind: any, rain: any } | null>(null);
  const [dailyStats, setDailyStats] = useState<{ min: number, max: number, rain: number } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Busca de Sugestões (Nominatim) com Debounce
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=5&countrycodes=br`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        console.error('Erro na busca de cidades:', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Busca de Clima (Open-Meteo)
  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherCity.lat}&longitude=${weatherCity.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto`);
        const data = await res.json();

        // Usar dados 'current' para o estado principal (Agora)
        const current = {
          temp: Math.round(data.current.temperature_2m),
          rain: Math.round(data.current.precipitation * 100) / 100, // em mm ou chance se preferir
          humidity: data.current.relative_humidity_2m,
          wind: data.current.wind_speed_10m
        };

        // Mapear gráfico começando da hora atual
        const now = new Date();
        const currentHour = now.getHours();
        const currentIndex = data.hourly.time.findIndex((t: string) => new Date(t).getHours() === currentHour);

        const mapped = data.hourly.time.slice(currentIndex, currentIndex + 24).map((t: string, i: number) => {
          const hourIndex = currentIndex + i;
          const hours = new Date(t).getHours();
          return {
            time: `${hours.toString().padStart(2, '0')}:00`,
            temp: data.hourly.temperature_2m[hourIndex],
            rain: data.hourly.precipitation_probability[hourIndex],
            humidity: data.hourly.relative_humidity_2m[hourIndex],
            wind: data.hourly.wind_speed_10m[hourIndex]
          };
        }); // Removido o filtro i % 2 para mostrar hora a hora

        // Previsão 5 dias
        const daily = data.daily.time.slice(1, 6).map((t: string, i: number) => {
          const dayIndex = i + 1;
          const date = new Date(t);
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          return {
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            max: Math.round(data.daily.temperature_2m_max[dayIndex]),
            min: Math.round(data.daily.temperature_2m_min[dayIndex]),
            rain: data.daily.precipitation_probability_max[dayIndex],
            code: data.daily.weather_code[dayIndex]
          };
        });

        setWeatherData(mapped);
        setFiveDayForecast(daily);
        setCurrentWeather(current);
        setDailyStats({
          max: Math.round(data.daily.temperature_2m_max[0]),
          min: Math.round(data.daily.temperature_2m_min[0]),
          rain: data.daily.precipitation_probability_max[0]
        });
      } catch (e) {
        console.error('Erro ao buscar clima:', e);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [weatherCity]);

  const currentStats = currentWeather || { temp: '--', humidity: '--', wind: '--', rain: '--' };

  const getRecommendation = () => {
    if (isLoadingWeather) return "Calculando...";
    const maxRain = Math.max(...weatherData.map(d => d.rain));
    if (maxRain > 60) return "Risco alto de temporais. Suspenda todas as atividades em campo e evite proximidade com árvores de grande porte.";
    if (maxRain > 30) return "Chuva moderada prevista. Evite podas drásticas e operações de escalada. Risco de solo escorregadio.";
    return "Condições favoráveis para manejo arbóreo e vistorias técnicas. Aproveite a estabilidade do clima.";
  };

  // Reutilizando a lógica de status dos Alertas
  const getServiceStatus = (dateStr: string, status: string) => {
    if (status === 'concluido') return 'concluido';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const serviceDate = new Date(dateStr);
    serviceDate.setHours(0, 0, 0, 0);

    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'atrasado';
    if (diffDays <= 7) return 'semana';
    return 'mes';
  };

  const pendingServices = useMemo(() => {
    return services.filter(s => s.status !== 'concluido')
      .map(service => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const serviceDate = new Date(service.data + 'T00:00:00');
        serviceDate.setHours(0, 0, 0, 0);

        const diffTime = serviceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let homeGroup = 'proximos';
        if (diffDays <= 0) homeGroup = 'hoje';
        else if (diffDays === 1) homeGroup = 'amanha';

        return {
          ...service,
          alertStatus: getServiceStatus(service.data, service.status),
          homeGroup,
          diffDays
        };
      })
      .sort((a, b) => new Date(a.data + 'T00:00:00').getTime() - new Date(b.data + 'T00:00:00').getTime());
  }, [services]);

  // Agrupando por categoria (limite total exibido para não estourar a tela: 6)
  const homeServices = pendingServices.slice(0, 6);
  const groupedServices = {
    hoje: homeServices.filter(s => s.homeGroup === 'hoje'),
    amanha: homeServices.filter(s => s.homeGroup === 'amanha'),
    proximos: homeServices.filter(s => s.homeGroup === 'proximos')
  };

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Trees size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Árvores Cadastradas</p>
            <h3 className="text-2xl font-bold text-slate-800">{trees.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Clientes Ativos</p>
            <h3 className="text-2xl font-bold text-slate-800">{clients.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Serviços Pendentes</p>
            <h3 className="text-2xl font-bold text-slate-800">{pendingServices.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-none lg:flex-1">
        {/* Weather Widget */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 col-span-1 lg:col-span-2 flex flex-col relative overflow-hidden group">
          {/* Background Decor */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors duration-500" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-20">
            <div className="flex items-center gap-5 flex-1 w-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                <CloudRain size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Monitoramento Climático</h2>
                <p className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Navigation size={12} className="fill-blue-600" />
                  {weatherCity.name}
                </p>
                <div className="mt-1 relative max-w-sm group/search">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar cidade..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />

                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setWeatherCity({ name: s.display_name.split(',')[0], lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
                            setSuggestions([]);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-3 text-xs text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <span className="font-bold text-slate-800">{s.display_name.split(',')[0]}</span>
                          <span className="text-slate-400 ml-2 truncate block">{s.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
                 <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Resumo do Dia</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {isLoadingWeather ? '--' : `${dailyStats?.min}° / ${dailyStats?.max}°`}
                  </span>
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md">
                    <CloudRain size={10} />
                    <span className="text-[10px] font-black">{isLoadingWeather ? '--' : `${dailyStats?.rain}%`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
            {/* Recommendation Card */}
            <div className="col-span-1 md:col-span-2 bg-emerald-600 rounded-3xl p-6 text-white flex items-center gap-5 shadow-lg shadow-emerald-900/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-100 uppercase tracking-wider mb-1">Recomendação Operacional</h4>
                <p className="text-sm text-white/90 leading-relaxed">
                  {getRecommendation()}
                </p>
              </div>
            </div>
            
            {/* Grouped 'Agora' Stats */}
            <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Monitoramento Agora</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Thermometer size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-blue-400 uppercase">Temperatura</span>
                    <span className="text-sm font-black text-slate-700">{isLoadingWeather ? '--' : `${currentStats.temp}°C`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <CloudRain size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-blue-400 uppercase">Chuva</span>
                    <span className="text-sm font-black text-blue-600">{isLoadingWeather ? '--' : `${currentStats.rain}%`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Droplets size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Umidade</span>
                    <span className="text-sm font-black text-emerald-700">{isLoadingWeather ? '--' : `${currentStats.humidity}%`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Wind size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Vento</span>
                    <span className="text-sm font-black text-emerald-700">{isLoadingWeather ? '--' : `${currentStats.wind}km/h`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-[320px] relative z-10 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weatherData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  formatter={(value: any, name: any) => {
                    if (name === 'temp') return [`${value}°C`, 'Temperatura'];
                    if (name === 'rain') return [`${value}%`, 'Prob. Chuva'];
                    return [value, name];
                  }}


                />
                <Area type="monotone" dataKey="temp" name="temp-bg" stroke="none" fillOpacity={1} fill="url(#colorTemp)" />
                <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 5-Day Forecast Row */}
          <div className="mt-6 pt-4 border-t border-slate-50 relative z-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">próximos 5 dias &gt;</h4>
            <div className="grid grid-cols-5 gap-3">
              {fiveDayForecast.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50/30 hover:bg-slate-100/50 transition-all duration-300">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.day}</span>
                  <div className="flex items-center gap-1.5 py-1">
                    <CloudRain size={14} className={day.rain > 30 ? 'text-blue-500' : 'text-slate-300'} />
                    <span className="text-sm font-black text-slate-700">{day.max}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300">{day.min}°</span>
                    <div className="w-1 h-1 rounded-full bg-blue-200" />
                    <span className="text-[10px] font-black text-blue-500">{day.rain}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Services Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-emerald-500" size={20} />
              Agendamentos Próximos
            </h2>
          </div>
          <div className="flex flex-col gap-5 overflow-y-auto pr-2 max-h-[350px]">
            {homeServices.length === 0 ? (
              <div className="text-center text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-sm">Nenhum serviço pendente.</p>
              </div>
            ) : (
              <>
                {groupedServices.hoje.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 border-b border-slate-100 pb-1">Hoje</h3>
                    {groupedServices.hoje.map(service => renderServiceCard(service, clients, trees, openPostServiceModal))}
                  </div>
                )}

                {groupedServices.amanha.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 border-b border-slate-100 pb-1">Amanhã</h3>
                    {groupedServices.amanha.map(service => renderServiceCard(service, clients, trees, openPostServiceModal))}
                  </div>
                )}

                {groupedServices.proximos.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-100 pb-1">Próximos</h3>
                    {groupedServices.proximos.map(service => renderServiceCard(service, clients, trees, openPostServiceModal))}
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/alertas')}
            className="mt-auto w-full pt-4 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Ver painel de alertas &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper para renderizar o card na Home
function renderServiceCard(service: any, clients: any[], trees: any[], openPostServiceModal?: (id: string) => void) {
  // Busca TODOS os proprietários únicos das árvores vinculadas ao serviço
  const ownerIds = new Set<string>();
  service.treeIds.forEach((treeId: string) => {
    const tree = trees.find((t: any) => t.id === treeId);
    if (tree?.cliente_id) ownerIds.add(tree.cliente_id);
  });
  const owners = [...ownerIds].map(id => clients.find((c: any) => c.id === id)).filter(Boolean);

  const isHoje = service.homeGroup === 'hoje';

  return (
    <div key={service.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-800 text-sm">{service.tipo}</h4>
        {/* Regra Operacional de Cores */}
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${service.alertStatus === 'atrasado' ? 'bg-red-500 shadow-sm shadow-red-500/50 animate-pulse' :
          service.alertStatus === 'semana' ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50' :
            'bg-emerald-500 shadow-sm shadow-emerald-500/50'
          }`}></span>
      </div>
      {/* Badges de proprietários — todos os donos únicos */}
      {owners.length > 0 ? (
        <div className="flex flex-wrap gap-1 mb-3">
          {owners.map((owner: any) => (
            <span key={owner.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              {owner.nome}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-3">Sem proprietário vinculado</p>
      )}

      <div className="flex justify-between items-end mt-1">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {service.responsavel}
          </div>
          <div className="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm w-fit">
            {new Date(service.data + 'T00:00:00').toLocaleDateString()}{service.horario && ` às ${service.horario}`}
          </div>
        </div>

        {isHoje && openPostServiceModal && (
          <button
            onClick={() => openPostServiceModal(service.id)}
            className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <CheckCircle2 size={14} /> Concluir
          </button>
        )}
      </div>
    </div>
  );
}
