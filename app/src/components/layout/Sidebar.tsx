import { Map as MapIcon, Users, AlertTriangle, Archive, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Início', path: '/' },
    { icon: <MapIcon size={20} />, label: 'Inventário', path: '/inventario' },
    { icon: <Users size={20} />, label: 'Clientes', path: '/clientes' },
    { icon: <AlertTriangle size={20} />, label: 'Alertas', path: '/alertas' },
    { icon: <Archive size={20} />, label: 'Acervo', path: '/acervo' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shadow-sm z-10 relative">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-slate-50">
        <img
          src="/logo_arbolia.png"
          alt="Arbolia"
          className="h-14 w-auto object-contain mt-4"
        />
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider px-2">Menu Principal</div>
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => 
              `w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-slate-50">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200">
          <Settings size={20} />
          <span className="font-medium text-sm">Configurações</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-3 mt-1 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-all duration-200">
          <LogOut size={20} />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
}
