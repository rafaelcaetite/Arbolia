import { X, Moon, Sun, Monitor, BellRing, LocateFixed, Eye } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useEffect, useState } from 'react';

export function SettingsModal() {
  const { isSettingsModalOpen, closeSettingsModal, theme, setTheme } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isSettingsModalOpen) {
      setIsVisible(true);
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSettingsModalOpen]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${animateIn ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div 
        className={`bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Monitor size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Configurações</h2>
              <p className="text-xs text-slate-500 font-medium">Preferências e aparência do sistema</p>
            </div>
          </div>
          <button 
            onClick={closeSettingsModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
          
          {/* Sessão: Aparência */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <Eye size={16} />
              <h3>Aparência</h3>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Modo de Cor</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                  Alterne entre modo claro e escuro para reduzir a fadiga visual durante as operações.
                </p>
              </div>
              
              <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    theme === 'light' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sun size={14} /> Claro
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    theme === 'dark' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Moon size={14} /> Escuro
                </button>
              </div>
            </div>
          </section>

          {/* Sessão: Notificações */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <BellRing size={16} />
              <h3>Notificações</h3>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Alertas Meteorológicos</h4>
                <p className="text-xs text-slate-500 mt-1">Receber notificações sobre mudanças bruscas de clima.</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle-weather" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-primary transition-transform translate-x-6 z-10" />
                <label htmlFor="toggle-weather" className="toggle-label block overflow-hidden h-6 rounded-full bg-primary cursor-pointer"></label>
              </div>
            </div>
          </section>

          {/* Sessão: Localização */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <LocateFixed size={16} />
              <h3>Localização</h3>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between opacity-60 cursor-not-allowed">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Alta Precisão GPS</h4>
                <p className="text-xs text-slate-500 mt-1">Habilitar tracking de precisão contínuo (Gasta mais bateria).</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input type="checkbox" disabled name="toggle" id="toggle-gps" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none border-slate-300 z-10" />
                <label htmlFor="toggle-gps" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300"></label>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex justify-center">
          <button
            onClick={closeSettingsModal}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .toggle-checkbox:checked {
          right: 0;
          border-color: var(--color-primary, #10b981);
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: var(--color-primary, #10b981);
        }
      `}} />
    </div>
  );
}
