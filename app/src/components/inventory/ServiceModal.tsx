import { useState, useMemo, useEffect } from 'react';
import { X, Save, Scissors, Axe, Stethoscope, Syringe } from 'lucide-react';
import { useAppStore, type Service } from '../../store/useAppStore';

export function ServiceModal() {
  const { isServiceModalOpen, closeServiceModal, createService, updateService, selectedTreeIds, employees, fetchEmployees, services, editingServiceId } = useAppStore();
  
  const editingService = editingServiceId ? services.find(s => s.id === editingServiceId) : null;

  const [formData, setFormData] = useState<Partial<Service>>({
    tipo: 'Poda',
    data: new Date().toISOString().split('T')[0],
    horario: '08:00',
    responsavel: '',
    status: 'agendado'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const technicians = useMemo(() => {
    return employees.filter(emp => (emp.role === 'tecnico' || emp.role === 'admin') && emp.status === 'ativo');
  }, [employees]);

  const [prevIsOpen, setPrevIsOpen] = useState(isServiceModalOpen);
  const [prevServiceId, setPrevServiceId] = useState<string | null | undefined>(undefined);

  // Sincronizar estado local com o serviço sendo editado ou resetar para novo
  if (isServiceModalOpen !== prevIsOpen || editingServiceId !== prevServiceId) {
    setPrevIsOpen(isServiceModalOpen);
    setPrevServiceId(editingServiceId);
    if (isServiceModalOpen) {
      if (editingService) {
        setFormData({
          tipo: editingService.tipo,
          data: editingService.data,
          horario: editingService.horario,
          responsavel: editingService.responsavel,
          status: editingService.status
        });
      } else {
        setFormData({
          tipo: 'Poda',
          data: new Date().toISOString().split('T')[0],
          horario: '08:00',
          responsavel: '',
          status: 'agendado'
        });
      }
    }
  }

  // Garantir que temos funcionários carregados
  useEffect(() => {
    if (isServiceModalOpen && employees.length === 0) {
      fetchEmployees();
    }
  }, [isServiceModalOpen, employees.length, fetchEmployees]);

  if (!isServiceModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!formData.responsavel) {
      alert('Por favor, selecione um responsável/técnico para o serviço.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingServiceId) {
        await updateService(editingServiceId, formData);
      } else {
        await createService(formData as Omit<Service, 'id' | 'treeIds'>);
      }
      closeServiceModal();
    } catch (err: unknown) {
      console.error('Erro ao processar serviço:', err);
      alert(`Erro ao salvar serviço: ${(err as Error).message || 'Verifique sua conexão'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceTypes = [
    { id: 'Poda', icon: <Scissors size={18} /> },
    { id: 'Supressão', icon: <Axe size={18} /> },
    { id: 'Avaliação', icon: <Stethoscope size={18} /> },
    { id: 'Tratamento', icon: <Syringe size={18} /> }
  ] as const;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={closeServiceModal}></div>
      
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-900/10 w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {editingServiceId ? 'Editar Agendamento' : (selectedTreeIds.length > 1 ? 'Novo Serviço em Massa' : 'Novo Serviço')}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {editingServiceId 
                ? `Serviço # ${editingServiceId.slice(0, 8).toUpperCase()}`
                : `${selectedTreeIds.length} ${selectedTreeIds.length > 1 ? 'árvores selecionadas' : 'árvore selecionada'}`
              }
            </p>
          </div>
          <button onClick={closeServiceModal} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-8 space-y-6 bg-slate-50/30">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Serviço</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {serviceTypes.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFormData({...formData, tipo: srv.id})}
                    className={`flex items-center gap-2 py-3.5 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border-2 ${
                      formData.tipo === srv.id 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    } disabled:opacity-50`}
                  >
                    {srv.icon}
                    {srv.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Agendada</label>
                <input 
                  type="date" 
                  required
                  disabled={isSubmitting}
                  value={formData.data || ''}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                <input 
                  type="time" 
                  required
                  disabled={isSubmitting}
                  value={formData.horario || ''}
                  onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável / Equipe</label>
              <select
                disabled={isSubmitting}
                value={formData.responsavel || ''}
                onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled>Selecione um responsável</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.nome}>{tech.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-primary text-white px-6 py-5 rounded-[24px] text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {editingServiceId ? 'Salvar Alterações' : 'Agendar Serviço'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
