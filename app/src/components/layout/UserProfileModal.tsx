import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, ShieldCheck, Camera, CheckCircle2, Loader2, Briefcase } from 'lucide-react';
import { useAppStore, type UserProfile } from '../../store/useAppStore';

export function UserProfileModal() {
  const { isProfileModalOpen, userProfile, closeProfileModal, updateProfile } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
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
        closeProfileModal();
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => {
    const url = prompt('Cole a URL da sua nova foto de perfil:', formData.foto_url);
    if (url !== null) {
      setFormData({ ...formData, foto_url: url });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={closeProfileModal}
      ></div>
      
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Banner Lateral / Topo */}
        <div className="md:w-40 bg-slate-900 p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-primary rounded-full blur-[60px]"></div>
          </div>

          <div 
            className="group relative w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white/20 shadow-xl cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={handlePhotoClick}
          >
            {formData.foto_url ? (
              <img src={formData.foto_url} alt={formData.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary text-white flex items-center justify-center text-3xl font-black">
                {userProfile.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
              <Camera size={20} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Editar</span>
            </div>
          </div>

          <div className="text-center z-10">
            <h3 className="text-white font-bold text-sm truncate max-w-full">{userProfile.nome.split(' ')[0]}</h3>
            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-1 block">
              {userProfile.role === 'admin' ? 'Admin' : userProfile.role === 'tecnico' ? 'Engenheiro' : 'Campo'}
            </span>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 p-8 md:p-10 bg-white relative">
          {showSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl shadow-emerald-100">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800">Perfil Atualizado!</h2>
            </div>
          ) : (
            <>
              <button 
                onClick={closeProfileModal} 
                className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>

              <div className="mb-8">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Meu Perfil</h2>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Briefcase size={12} className="text-primary" /> 
                  Membro desde {new Date(userProfile.data_cadastro).toLocaleDateString()}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto pr-2 max-h-[50vh] scrollbar-hide">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <User size={12} className="text-primary" /> Nome Completo
                  </label>
                  <input 
                    type="text"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-700 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" /> Data Nasc.
                    </label>
                    <input 
                      type="date"
                      value={formData.data_nascimento}
                      onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-700 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Phone size={12} className="text-primary" /> Telefone
                    </label>
                    <input 
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                      className="bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-700 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-primary" /> Registro Profissional (CREA)
                  </label>
                  <input 
                    type="text"
                    placeholder="CREA-XX 000000"
                    value={formData.crea}
                    onChange={e => setFormData({ ...formData, crea: e.target.value })}
                    className="bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-700 text-sm font-bold placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Atualizar Perfil'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
