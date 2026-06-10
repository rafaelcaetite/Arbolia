import { useState } from 'react';
import { X, Building2, User, FileText, Mail, Phone, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppStore, type Client } from '../../store/useAppStore';

export function ClientFormModal() {
  const { 
    isClientModalOpen, 
    editingClientId, 
    clients, 
    closeClientModal, 
    createClient, 
    updateClient 
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    endereco: '',
    status: 'ativo'
  });

  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : null;

  const [prevClientId, setPrevClientId] = useState<string | null | undefined>(undefined);
  const [prevIsOpen, setPrevIsOpen] = useState(isClientModalOpen);

  if (isClientModalOpen !== prevIsOpen || editingClientId !== prevClientId) {
    setPrevIsOpen(isClientModalOpen);
    setPrevClientId(editingClientId);
    setEmailError(false);
    if (editingClient) {
      setFormData({
        nome: editingClient.nome,
        documento: editingClient.documento,
        email: editingClient.email,
        telefone: editingClient.telefone,
        endereco: editingClient.endereco,
        status: editingClient.status
      });
    } else {
      setFormData({
        nome: '',
        documento: '',
        email: '',
        telefone: '',
        endereco: '',
        status: 'ativo'
      });
    }
  }

  if (!isClientModalOpen) return null;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError(true);
      return;
    }
    
    setEmailError(false);
    setIsLoading(true);
    
    try {
      if (editingClientId) {
        await updateClient(editingClientId, formData);
      } else {
        await createClient(formData as Omit<Client, 'id' | 'data_cadastro'>);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeClientModal();
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !showSuccess) {
      closeClientModal();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={handleClose}
      ></div>
      
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {showSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-90 duration-300">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-200 animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Sucesso!</h2>
            <p className="text-slate-500">As informações do cliente foram salvas com sucesso.</p>
          </div>
        ) : (
          <>
            <div className="px-8 pt-8 pb-4 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Gerenciamento de Carteira
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-primary" /> Nome do Cliente / Razão Social
                </label>
                <input 
                  required
                  type="text"
                  maxLength={80}
                  placeholder="Ex: Empresa Arbolia Ltda"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <FileText size={12} className="text-primary" /> CPF / CNPJ
                </label>
                <input 
                  required
                  type="text"
                  maxLength={18}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={formData.documento}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 14) val = val.slice(0, 14);

                    let masked: string;
                    if (val.length <= 11) {
                      masked = val
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
                    } else {
                      masked = val
                        .replace(/^(\d{2})(\d)/, '$1.$2')
                        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                        .replace(/\.(\d{3})(\d)/, '.$1/$2')
                        .replace(/(\d{4})(\d)/, '$1-$2');
                    }
                    setFormData({ ...formData, documento: masked });
                  }}
                  className="bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-mono text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-primary" /> E-mail
                    </div>
                    {emailError && <span className="text-red-500 normal-case">E-mail inválido</span>}
                  </label>
                  <input 
                    required
                    type="email"
                    maxLength={80}
                    placeholder="usuario@dominio.com"
                    value={formData.email}
                    onChange={e => {
                      setEmailError(false);
                      setFormData({ ...formData, email: e.target.value.toLowerCase().trim() });
                    }}
                    className={`bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 text-sm placeholder:text-slate-300 focus:ring-2 transition-all outline-none ${
                      emailError ? 'ring-2 ring-red-100 bg-red-50/30' : 'focus:ring-primary/20'
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Phone size={12} className="text-primary" /> Telefone
                  </label>
                  <input 
                    required
                    type="text"
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 11) val = val.slice(0, 11);
                      
                      let masked: string = val;
                      if (val.length > 0) {
                        masked = '(' + val;
                        if (val.length > 2) {
                          masked = '(' + val.slice(0, 2) + ') ' + val.slice(2);
                        }
                        if (val.length > 7) {
                          masked = '(' + val.slice(0, 2) + ') ' + val.slice(2, 7) + '-' + val.slice(7);
                        }
                      }
                      setFormData({ ...formData, telefone: masked });
                    }}
                    className="bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-primary" /> Endereço Completo
                  </div>
                  <span className="text-red-500 normal-case">* obrigatório</span>
                </label>
                <input 
                  required
                  type="text"
                  maxLength={150}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  className="bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="mt-4 bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-xl shadow-slate-200 hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    {editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
