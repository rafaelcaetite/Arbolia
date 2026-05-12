import { useState, useMemo } from 'react';
import { Search, UserPlus, Mail, Phone, ShieldCheck, Plus, FileText, X, Camera, Eye, EyeOff } from 'lucide-react';
import { useAppStore, type UserProfile } from '../store/useAppStore';
import { SecureImage } from '../components/common/SecureImage';

export function Employees() {
  const { employees, createEmployee } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equipe Arbolia</h1>
          <p className="text-slate-500 font-medium">Gerencie os acessos e perfis técnicos da plataforma.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <UserPlus size={20} />
          Novo Funcionário
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-300"
        />
      </div>

      {/* Grid de Funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <SecureImage 
                  src={emp.foto_url} 
                  alt={emp.nome} 
                  className="w-16 h-16 rounded-2xl border-2 border-slate-50 shadow-sm" 
                  fallbackInitial={emp.nome.charAt(0).toUpperCase()}
                />
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{emp.nome}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    emp.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                    emp.role === 'tecnico' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    'bg-emerald-50 text-emerald-600 border border-blue-100'
                  }`}>
                    {emp.role === 'admin' ? 'Administrador' : emp.role === 'tecnico' ? 'Técnico' : 'Assistente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-slate-400" />
                </div>
                <span className="truncate">{emp.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-slate-400" />
                </div>
                <span>{emp.telefone || '(00) 0000-0000'}</span>
              </div>
              {emp.crea && (
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-emerald-500" />
                  </div>
                  <span>CREA: <strong className="text-slate-700">{emp.crea}</strong></span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
              <button 
                onClick={() => setSelectedEmployee(emp)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <FileText size={14} /> Perfil
              </button>
              <button className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl transition-all">
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nenhum funcionário encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && <EmployeeModal onClose={() => setIsModalOpen(false)} onSave={createEmployee} />}
      
      {selectedEmployee && (
        <EmployeeDetailModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}

function EmployeeModal({ onClose, onSave }: { onClose: () => void, onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'tecnico',
    crea: '',
    telefone: '',
    foto_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Novo Funcionário</h2>
            <p className="text-slate-500 text-sm font-medium">Preencha os dados de acesso da equipe.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* Foto Placeholder */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1 cursor-pointer hover:border-primary hover:text-primary transition-all group overflow-hidden relative">
              {formData.foto_url ? (
                <img src={formData.foto_url} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={24} />
                  <span className="text-[10px] font-bold uppercase">Foto</span>
                </>
              )}
            </div>
            <input 
              type="text" 
              placeholder="Link da foto (URL)" 
              value={formData.foto_url}
              onChange={(e) => setFormData({...formData, foto_url: e.target.value})}
              className="text-[10px] font-medium text-slate-400 outline-none hover:text-primary transition-colors text-center w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
              <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Profissional</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha Inicial</label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium pr-12" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cargo / Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-slate-700">
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
                <option value="campo">Assistente</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">CREA (Opcional)</label>
              <input value={formData.crea} onChange={e => setFormData({...formData, crea: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium" />
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cancelar</button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar Cadastro'}
          </button>
        </div>
      </div>
    </div>
  );
}
function EmployeeDetailModal({ employee, onClose }: { employee: UserProfile, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500 flex flex-col md:flex-row">
        {/* Banner Lateral / Foto */}
        <div className="md:w-56 bg-slate-900 p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-primary rounded-full blur-[60px]"></div>
          </div>
          
          <SecureImage 
            src={employee.foto_url}
            alt={employee.nome}
            className="w-32 h-32 rounded-[40px] border-2 border-white/20 shadow-xl z-10"
            fallbackInitial={employee.nome.charAt(0).toUpperCase()}
          />
          
          <div className="text-center z-10">
            <h3 className="text-white font-bold text-lg">{employee.nome.split(' ')[0]}</h3>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 block">
              {employee.role === 'admin' ? 'Administrador' : employee.role === 'tecnico' ? 'Engenheiro' : 'Assistente'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-10 md:p-12 relative bg-white">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all">
            <X size={20} />
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight underline decoration-primary/30 decoration-4 underline-offset-8">Perfil do Funcionário</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">Dados de Cadastro</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Mail size={12} className="text-primary" /> Email
                </label>
                <p className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">{employee.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Phone size={12} className="text-primary" /> Telefone
                </label>
                <p className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">{employee.telefone || 'Não informado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck size={12} className="text-primary" /> Registro (CREA)
                </label>
                <p className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">{employee.crea || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Camera size={12} className="text-primary" /> Nascimento
                </label>
                <p className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  {employee.data_nascimento ? new Date(employee.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-medium text-slate-400 text-center italic">
                Colaborador ativo desde {new Date(employee.data_cadastro).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
