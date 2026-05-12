import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, ShieldCheck, Camera, CheckCircle2, Loader2, Briefcase, Pencil } from 'lucide-react';
import { useAppStore, type UserProfile } from '../../store/useAppStore';

export function UserProfileModal() {
  const { isProfileModalOpen, userProfile, closeProfileModal, updateProfile } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (userProfile) {
      setFormData({
        nome: userProfile.nome,
        telefone: userProfile.telefone || '',
        crea: userProfile.crea || '',
        data_nascimento: userProfile.data_nascimento || '',
        foto_url: userProfile.foto_url || ''
      });
    }
    // Sempre volta para o modo visualização ao abrir
    if (isProfileModalOpen) setIsEditing(false);
  }, [userProfile, isProfileModalOpen]);

  if (!isProfileModalOpen || !userProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateProfile(formData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsEditing(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    
    setFormData({ ...formData, telefone: value });
  };

  const handlePhotoClick = () => {
    const url = prompt('Cole a URL da sua nova foto de perfil:', formData.foto_url || '');
    if (url !== null) {
      setFormData({ ...formData, foto_url: url });
      if (!isEditing) {
        updateProfile({ foto_url: url });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" 
        onClick={closeProfileModal}
      ></div>
      
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row min-h-[500px] my-auto">
        
        {/* Banner Lateral */}
        <div className="md:w-64 bg-slate-900 p-10 flex flex-col items-center justify-between gap-8 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-80 h-80 bg-primary rounded-full blur-[80px] animate-pulse"></div>
          </div>

          <div className="flex flex-col items-center gap-6 z-10 w-full">
            <div 
              className="group relative w-36 h-36 rounded-[48px] overflow-hidden border-4 border-white/10 shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95"
              onClick={handlePhotoClick}
            >
              {userProfile.foto_url ? (
                <img src={userProfile.foto_url} alt={userProfile.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary text-white flex items-center justify-center text-5xl font-black">
                  {userProfile.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                <Camera size={28} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Alterar</span>
              </div>
            </div>

            <div className="text-center w-full">
              <h3 className="text-white font-black text-xl truncate leading-tight">{userProfile.nome.split(' ')[0]}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/30">
                  {userProfile.role === 'admin' ? 'Administrador' : userProfile.role === 'tecnico' ? 'Engenheiro' : 'Campo'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full z-10">
            <button 
              onClick={closeProfileModal}
              className="w-full py-4 rounded-2xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-center gap-2"
            >
              <X size={18} /> Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-10 md:p-14 bg-white relative overflow-y-auto max-h-[90vh]">
          {showSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-90 duration-300 py-20">
              <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-100 animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-800">Dados Atualizados!</h2>
              <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Sincronizando com o servidor...</p>
            </div>
          ) : isEditing ? (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Editar Perfil</h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-primary font-black text-xs uppercase tracking-widest hover:underline"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-8 pr-2">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User size={14} className="text-primary" /> Nome Completo
                  </label>
                  <input 
                    type="text"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4.5 text-slate-700 text-base font-bold focus:border-primary/20 focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar size={14} className="text-primary" /> Data de Nascimento
                  </label>
                  <input 
                    type="date"
                    value={formData.data_nascimento}
                    onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4.5 text-slate-700 text-base font-bold focus:border-primary/20 focus:bg-white transition-all outline-none shadow-sm w-full"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Phone size={14} className="text-primary" /> Telefone de Contato
                  </label>
                  <input 
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4.5 text-slate-700 text-base font-bold focus:border-primary/20 focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" /> Registro Profissional (CREA)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: CREA-MG 123456"
                    value={formData.crea}
                    onChange={e => setFormData({ ...formData, crea: e.target.value })}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4.5 text-slate-700 text-base font-bold focus:border-primary/20 focus:bg-white transition-all outline-none shadow-sm"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-slate-900 text-white font-black py-5 rounded-3xl shadow-2xl shadow-slate-200 hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-lg mt-2"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Confirmar Alterações'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in slide-in-from-left-4 duration-400">
              <div className="mb-12">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-4">Informações de Perfil</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Briefcase size={12} className="text-primary" /> Ativo desde {new Date(userProfile.data_cadastro).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10 mb-12">
                <div className="group">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 ml-1 group-hover:text-primary transition-colors">Nome Completo</div>
                  <div className="text-2xl font-black text-slate-700 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                    {userProfile.nome}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="group">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 ml-1 group-hover:text-primary transition-colors">Data de Nascimento</div>
                    <div className="text-xl font-bold text-slate-600 flex items-center gap-3">
                      <Calendar size={20} className="text-slate-300" />
                      {userProfile.data_nascimento ? new Date(userProfile.data_nascimento).toLocaleDateString('pt-BR') : <span className="text-slate-200 italic font-medium">Não informada</span>}
                    </div>
                  </div>

                  <div className="group">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 ml-1 group-hover:text-primary transition-colors">Telefone de Contato</div>
                    <div className="text-xl font-bold text-slate-600 flex items-center gap-3">
                      <Phone size={20} className="text-slate-300" />
                      {userProfile.telefone || <span className="text-slate-200 italic font-medium">Não informado</span>}
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 ml-1 group-hover:text-primary transition-colors">Registro Profissional</div>
                  <div className="text-xl font-bold text-slate-600 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-slate-300" />
                    {userProfile.crea || <span className="text-slate-200 italic font-medium">Nenhum registro vinculado</span>}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsEditing(true)}
                className="group flex items-center gap-4 bg-slate-50 hover:bg-slate-900 px-8 py-5 rounded-[24px] transition-all"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                  <Pencil size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black text-slate-800 group-hover:text-white transition-colors">Editar Perfil</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-400 transition-colors">Atualizar seus dados cadastrais</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
