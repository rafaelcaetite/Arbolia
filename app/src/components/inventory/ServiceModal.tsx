import { useState, useMemo } from 'react';
import { X, Save, Scissors, Axe, Stethoscope, Syringe } from 'lucide-react';
import { useAppStore, type Service } from '../../store/useAppStore';

export function ServiceModal() {
  const { isServiceModalOpen, closeServiceModal, createService, selectedTreeIds, employees, fetchEmployees } = useAppStore();
  
  const [formData, setFormData] = useState<Partial<Service>>({
    tipo: 'Poda',
    data: new Date().toISOString().split('T')[0],
    horario: '08:00',
    responsavel: '',
    status: 'agendado'
  });

  const technicians = useMemo(() => {
    return employees.filter(emp => (emp.role === 'tecnico' || emp.role === 'admin') && emp.status === 'ativo');
  }, [employees]);

  // Carregar funcionários se a lista estiver vazia ao abrir o modal
  useState(() => {
    if (employees.length === 0) {
      fetchEmployees();
    }
  });

  if (!isServiceModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createService(formData as Omit<Service, 'id' | 'treeIds'>);
    closeServiceModal();
  };

  const serviceTypes = [
    { id: 'Poda', icon: <Scissors size={18} /> },
    { id: 'Supressão', icon: <Axe size={18} /> },
    { id: 'Avaliação', icon: <Stethoscope size={18} /> },
    { id: 'Tratamento', icon: <Syringe size={18} /> }
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={closeServiceModal}></div>
      
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Novo Serviço em Massa</h2>
            <p className="text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full mt-1 border border-emerald-100">
              {selectedTreeIds.length} árvore(s) selecionada(s)
            </p>
          </div>
          <button onClick={closeServiceModal} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/30">
          <form id="service-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Serviço</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {serviceTypes.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setFormData({...formData, tipo: srv.id})}
                    className={`flex items-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                      formData.tipo === srv.id 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {srv.icon}
                    {srv.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Agendada</label>
                <input 
                  type="date" 
                  required
                  value={formData.data || ''}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horário</label>
                <input 
                  type="time" 
                  required
                  value={formData.horario || ''}
                  onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Responsável / Equipe</label>
              <select
                required
                value={formData.responsavel || ''}
                onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione um responsável</option>
                <optgroup label="Técnicos e Admins">
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.nome}>{tech.nome}</option>
                  ))}
                </optgroup>
                <optgroup label="Outros">
                  <option value="Equipe Terceirizada">Equipe Terceirizada</option>
                  <option value="Equipe Alfa">Equipe Alfa</option>
                </optgroup>
              </select>
            </div>
          </form>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-white flex justify-end">
          <button 
            type="submit"
            form="service-form"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.01] active:scale-95"
          >
            <Save size={18} />
            Agendar Serviço
          </button>
        </div>
      </div>
    </div>
  );
}
