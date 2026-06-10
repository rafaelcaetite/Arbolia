import { useState, useEffect, useRef } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { CloudRain, Thermometer, Droplets, Wind, ShieldAlert, Navigation, Search } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface WeatherWidgetProps {
  formattedTime: string;
}

export function WeatherWidget({ formattedTime }: WeatherWidgetProps) {
  const { weatherCity, setWeatherCity, weatherSettings } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; lat: number; lon: number; display_name: string; isBrazil: boolean }>>([]);
  const [weatherData, setWeatherData] = useState<Array<{ time: string, temp: number, rain: number, precipitation: number, humidity: number, wind: number, gusts: number }>>([]);
  const [fiveDayForecast, setFiveDayForecast] = useState<Array<{ day: string, date: string, max: number, min: number, rain: number, code: number }>>([]);
  const [currentWeather, setCurrentWeather] = useState<{ temp: number, humidity: number, wind: number, rain: number, precipitation?: number } | null>(null);
  const [dailyStats, setDailyStats] = useState<{ min: number, max: number, rain: number } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchCache = useRef<Record<string, any[]>>({});

  useEffect(() => {
    if (searchQuery.length < 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }

    if (searchCache.current[searchQuery]) {
      setSuggestions(searchCache.current[searchQuery]);
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=20&language=pt&format=json`,
          { signal: abortController.signal }
        );
        const data = await res.json();
        
        if (!data.results) {
          setSuggestions([]);
          return;
        }

        const mapped = data.results.map((item: { admin1?: string; country?: string; country_code?: string; name: string; latitude: number; longitude: number }) => {
          const state = item.admin1 ? `, ${item.admin1}` : '';
          const country = item.country ? ` - ${item.country}` : '';
          const isBrazil = item.country_code === 'BR' || 
                           (item.country && (item.country.toLowerCase() === 'brasil' || item.country.toLowerCase() === 'brazil'));
          return {
            display_name: `${item.name}${state}${country}`,
            name: item.name,
            lat: item.latitude,
            lon: item.longitude,
            isBrazil
          };
        });

        const sorted = [...mapped].sort((a, b) => {
          if (a.isBrazil && !b.isBrazil) return -1;
          if (!a.isBrazil && b.isBrazil) return 1;
          return 0;
        });

        const results = sorted.slice(0, 5);
        searchCache.current[searchQuery] = results;
        setSuggestions(results);
      } catch (err) {
        const e = err as Error;
        if (e.name !== 'AbortError') {
          console.error('Erro na busca de cidades:', e);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const tempParam = weatherSettings.tempUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
        const windParam = weatherSettings.windSpeedUnit === 'ms' ? '&wind_speed_unit=ms' : '';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${weatherCity.lat}&longitude=${weatherCity.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,relative_humidity_2m,wind_speed_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto${tempParam}${windParam}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        if (!data.current || !data.hourly || !data.daily) {
          throw new Error('Incomplete weather data received');
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentIndex = data.hourly.time.findIndex((t: string) => new Date(t).getHours() === currentHour);
        const currentProb = currentIndex !== -1 ? data.hourly.precipitation_probability[currentIndex] : 0;

        const current = {
          temp: Math.round(data.current.temperature_2m),
          rain: currentProb,
          precipitation: data.current.precipitation || 0,
          humidity: data.current.relative_humidity_2m,
          wind: data.current.wind_speed_10m
        };

        const mapped = data.hourly.time.slice(currentIndex, currentIndex + 24).map((t: string, i: number) => {
          const hourIndex = currentIndex + i;
          const hours = new Date(t).getHours();
          return {
            time: `${hours.toString().padStart(2, '0')}:00`,
            temp: data.hourly.temperature_2m[hourIndex],
            rain: data.hourly.precipitation_probability[hourIndex],
            precipitation: data.hourly.precipitation[hourIndex] || 0,
            humidity: data.hourly.relative_humidity_2m[hourIndex],
            wind: data.hourly.wind_speed_10m[hourIndex],
            gusts: data.hourly.wind_gusts_10m[hourIndex] || 0
          };
        });

        const daily = data.daily.time.slice(1, 6).map((t: string, i: number) => {
          const dayIndex = i + 1;
          const date = new Date(t + 'T00:00:00');
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          const dayDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          return {
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            date: dayDate,
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
        console.error('Erro ao buscar clima na Home:', e);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();

    const intervalMs = weatherSettings.syncInterval * 60 * 1000;
    const intervalId = setInterval(fetchWeather, intervalMs);

    return () => clearInterval(intervalId);
  }, [weatherCity, weatherSettings]);

  const currentStats = currentWeather || { temp: '--', humidity: '--', wind: '--', rain: '--', precipitation: '--' };

  const getRecommendation = () => {
    if (isLoadingWeather || weatherData.length === 0) return "Calculando...";
    const maxGusts = Math.max(...weatherData.map(d => d.gusts || 0));
    const maxRainProb = Math.max(...weatherData.map(d => d.rain || 0));
    const maxRainVol = Math.max(...weatherData.map(d => d.precipitation || 0));

    const isMs = weatherSettings.windSpeedUnit === 'ms';
    const limitHigh = isMs ? 15 : 55;
    const limitWarning = isMs ? 11 : 40;

    if (maxGusts > limitHigh || (maxRainProb > 50 && maxRainVol > 10)) {
      return "Risco alto de temporais ou ventania severa. Paralisação total das atividades em campo.";
    }
    if (maxGusts > limitWarning || (maxRainProb > 30 && maxRainVol > 2)) {
      return "Condições de atenção. O Responsável Técnico da equipe avalia o local. Suspende-se apenas podas críticas ou uso de cesto aéreo.";
    }
    return "Condições favoráveis para manejo arbóreo. Operação normal.";
  };

  let recBg = 'bg-emerald-600 shadow-emerald-950/20';
  let recTextHeader = 'text-emerald-100';
  
  if (!isLoadingWeather && weatherData.length > 0) {
    const maxGusts = Math.max(...weatherData.map(d => d.gusts || 0));
    const maxRainProb = Math.max(...weatherData.map(d => d.rain || 0));
    const maxRainVol = Math.max(...weatherData.map(d => d.precipitation || 0));

    const isMs = weatherSettings.windSpeedUnit === 'ms';
    const limitHigh = isMs ? 15 : 55;
    const limitWarning = isMs ? 11 : 40;

    if (maxGusts > limitHigh || (maxRainProb > 50 && maxRainVol > 10)) {
      recBg = 'bg-red-600 shadow-red-950/20';
      recTextHeader = 'text-red-100';
    } else if (maxGusts > limitWarning || (maxRainProb > 30 && maxRainVol > 2)) {
      recBg = 'bg-orange-500 shadow-orange-950/20';
      recTextHeader = 'text-orange-100';
    }
  } else if (isLoadingWeather) {
    recBg = 'bg-slate-600 shadow-slate-950/20 animate-pulse';
    recTextHeader = 'text-slate-200';
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 col-span-1 lg:col-span-2 flex flex-col relative overflow-hidden group h-full">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors duration-500" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-20">
        <div className="flex items-center gap-5 flex-1 w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none shrink-0">
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
                        setWeatherCity({ name: s.name, lat: s.lat, lon: s.lon });
                        setSuggestions([]);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-4 py-3 text-xs text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <span className="font-bold text-slate-800">{s.name}</span>
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
        <div className={`col-span-1 md:col-span-2 ${recBg} rounded-3xl p-6 text-white flex items-center gap-5 shadow-lg transition-all duration-500`}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h4 className={`font-bold text-sm ${recTextHeader} uppercase tracking-wider mb-1`}>Recomendação Operacional</h4>
            <p className="text-sm text-white/90 leading-relaxed">
              {getRecommendation()}
            </p>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
          <div className="flex justify-between items-end ml-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitoramento Agora {formattedTime}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Thermometer size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-blue-400 uppercase">Temperatura</span>
                <span className="text-sm font-black text-slate-700">{isLoadingWeather ? '--' : `${currentStats.temp}°${weatherSettings.tempUnit === 'fahrenheit' ? 'F' : 'C'}`}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <CloudRain size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-blue-400 uppercase">Chuva</span>
                <span className="text-sm font-black text-blue-600">{isLoadingWeather ? '--' : `${currentStats.rain}%/${currentStats.precipitation}mm`}</span>
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
                <span className="text-sm font-black text-emerald-700">{isLoadingWeather ? '--' : `${currentStats.wind}${weatherSettings.windSpeedUnit === 'ms' ? ' m/s' : ' km/h'}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-[320px] relative z-10 mt-6 flex-1 min-h-[300px]">
        {weatherData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
            <ComposedChart 
              data={weatherData} 
              margin={{ top: 10, right: -20, left: -20, bottom: 30 }}
              style={{ outline: 'none' }}
              tabIndex={-1}
            >
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                
                <linearGradient id="lineGradient" x1="0" y1="10" x2="0" y2="290" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8B0000" />
                  <stop offset="14%" stopColor="#FF0000" />
                  <stop offset="28%" stopColor="#FF8C00" />
                  <stop offset="42%" stopColor="#FFB800" />
                  <stop offset="57%" stopColor="#32CD32" />
                  <stop offset="82%" stopColor="#87CEFA" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={15} />
              
              <YAxis 
                yAxisId="left"
                domain={weatherSettings.tempUnit === 'fahrenheit' ? [40, 105] : [5, 40]} 
                allowDecimals={false}
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
                unit="°"
              />
              
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 100]} 
                hide
              />

              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-2">{label}</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                              <Thermometer size={14} className="text-orange-500" />
                              <span className="text-xs font-bold text-slate-600">Temperatura</span>
                            </div>
                            <span className="text-xs font-black text-slate-800">{data.temp}°{weatherSettings.tempUnit === 'fahrenheit' ? 'F' : 'C'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                              <CloudRain size={14} className="text-blue-500" />
                              <span className="text-xs font-bold text-slate-600">Prob. Chuva / Volume</span>
                            </div>
                            <span className="text-xs font-black text-slate-800">{data.rain}% / {data.precipitation} mm</span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                              <Droplets size={14} className="text-emerald-500" />
                              <span className="text-xs font-bold text-slate-600">Umidade</span>
                            </div>
                            <span className="text-xs font-black text-slate-800">{data.humidity}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                              <Wind size={14} className="text-emerald-600" />
                              <span className="text-xs font-bold text-slate-600">Vento / Rajada</span>
                            </div>
                            <span className="text-xs font-black text-slate-800">
                              {data.wind} {weatherSettings.windSpeedUnit === 'ms' ? 'm/s' : 'km/h'} / {data.gusts} {weatherSettings.windSpeedUnit === 'ms' ? 'm/s' : 'km/h'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area yAxisId="left" type="monotone" dataKey="temp" name="temp-bg" stroke="none" fillOpacity={1} fill="url(#colorTemp)" />
              <Bar yAxisId="right" dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp"
                stroke="url(#lineGradient)"
                strokeWidth={5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 relative z-10">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">próximos 5 dias &gt;</h4>
        <div className="grid grid-cols-5 gap-3">
          {fiveDayForecast.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50/30 hover:bg-slate-100/50 transition-all duration-300 border border-transparent hover:border-slate-100">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.day}</span>
                <span className="text-[9px] font-bold text-slate-400">{day.date}</span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <CloudRain size={14} className={day.rain > 30 ? 'text-blue-500' : 'text-slate-300'} />
                <span className="text-sm font-black text-slate-700">{day.max}°</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-300">{day.min}°</span>
                <div className="w-1 h-1 rounded-full bg-blue-200" />
                <div className="flex items-center gap-1 text-blue-500">
                  <CloudRain size={10} />
                  <span className="text-[10px] font-black">{day.rain}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
