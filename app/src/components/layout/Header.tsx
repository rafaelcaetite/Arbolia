import { Bell, Search, CloudRain } from 'lucide-react';

export function Header() {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Bom dia, Técnico 👋</h1>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <CloudRain size={16} className="text-blue-400" />
          <span>22°C - Chuva Fraca (Mock)</span>
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
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Técnico Admin</span>
            <span className="text-xs text-slate-500">Engenharia</span>
          </div>
        </div>
      </div>
    </header>
  );
}
