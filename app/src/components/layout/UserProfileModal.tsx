import { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Calendar, ShieldCheck, Camera, CheckCircle2, Loader2, Briefcase, AlertCircle } from 'lucide-react';
import { useAppStore, type UserProfile } from '../../store/useAppStore';
import { compressImageToBase64 } from '../../lib/imageCompression';

export function UserProfileModal() {
  const { isProfileModalOpen, userProfile, closeProfileModal, updateProfile } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSecurePhoto = async () => {
      if (userProfile?.foto_url) {
        setDisplayUrl(userProfile.foto_url);
      }
    };

    if (userProfile) {
      setFormData({
        nome: userProfile.nome,
        telefone: userProfile.telefone || '',
        crea: userProfile.crea || '',
        data_nascimento: userProfile.data_nascimento || '',
        foto_url: userProfile.foto_url || ''
      });
      loadSecurePhoto();
    }
  }, [userProfile, isProfileModalOpen]);

  if (!isProfileModalOpen || !userProfile) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Comprime a foto de perfil de avatar para no máximo 300px, mantendo excelente nitidez e tamanho ínfimo (<15KB)
      const base64String = await compressImageToBase64(file, 300, 0.8);
      
      setFormData(prev => ({ ...prev, foto_url: base64String }));
      setDisplayUrl(base64String);
      await updateProfile({ foto_url: base64String });
    } catch (err: any) {
      console.error('Erro crítico no upload da foto de perfil:', err);
      setError('Erro ao processar imagem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await updateProfile(formData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeProfileModal();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setError('Falha ao sincronizar com o banco de dados.');
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

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={closeProfileModal}
      ></div>
      
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh] my-auto">
        
        {/* Banner Lateral */}
        <div className="md:w-64 bg-slate-900 p-10 flex flex-col items-center justify-center gap-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-primary rounded-full blur-[60px]"></div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload} 
          />

          <div 
            className="group relative w-36 h-36 rounded-[48px] overflow-hidden border-2 border-white/20 shadow-xl cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={() => fileInputRef.current?.click()}
          >
            {displayUrl ? (
              <img src={displayUrl} alt={formData.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary text-white flex items-center justify-center text-4xl font-black">
                {userProfile.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 text-center p-2">
              <Camera size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Trocar Foto (Max 1MB)</span>
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 size={32} className="text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center z-10">
            <h3 className="text-white font-bold text-lg truncate max-w-full">{userProfile.nome.split(' ')[0]}</h3>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1 block">
              {userProfile.role === 'admin' ? 'Administrador' : userProfile.role === 'tecnico' ? 'Técnico' : 'Campo'}
            </span>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 p-10 md:p-14 bg-white relative">
          {showSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-90 duration-500">
              <div className="w-20 h-20 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-100/50">
                <CheckCircle2 size={44} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Alterações Salvas!</h2>
              <p className="text-slate-400 mt-2 font-bold text-[10px] uppercase tracking-[0.3em]">Perfil Sincronizado</p>
            </div>
          ) : (
            <>
              <button 
                onClick={closeProfileModal} 
                className="absolute top-8 right-8 p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight underline decoration-primary/30 decoration-4 underline-offset-8">Meu Perfil</h2>
                <div className="flex items-center gap-2 mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Briefcase size={14} className="text-primary" /> 
                  Na equipe Arbolia desde {userProfile.data_cadastro ? new Date(userProfile.data_cadastro).toLocaleDateString() : 'Início'}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto pr-4 max-h-[55vh] scrollbar-hide">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <User size={12} className="text-primary" /> Nome Completo
                  </label>
                  <input 
                    type="text"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-700 text-sm font-bold focus:border-primary/20 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" /> Data de Nascimento
                    </label>
                    <input 
                      type="date"
                      value={formData.data_nascimento}
                      onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-700 text-sm font-bold focus:border-primary/20 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Phone size={12} className="text-primary" /> Telefone de Contato
                    </label>
                    <input 
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={handlePhoneChange}
                      className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-700 text-sm font-bold focus:border-primary/20 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-primary" /> Registro Profissional (CREA)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: CREA-MG 123456"
                    value={formData.crea}
                    onChange={e => setFormData({ ...formData, crea: e.target.value })}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-700 text-sm font-bold placeholder:text-slate-200 focus:border-primary/20 focus:bg-white transition-all outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl shadow-slate-200 hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-base"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Alterações'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
