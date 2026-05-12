import { useState, useEffect } from 'react';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => Promise<void>;
  title: string;
  description: string;
  type: 'rename' | 'delete';
  initialValue?: string;
  confirmLabel?: string;
}

export function ActionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  type, 
  initialValue = '', 
  confirmLabel 
}: ActionModalProps) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(type === 'rename' ? value : undefined);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Erro na ação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 border border-slate-100 flex flex-col">
        
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center text-center animate-in zoom-in-90 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Sucesso!</h3>
            <p className="text-slate-500 font-medium text-sm">Operação realizada com êxito.</p>
          </div>
        ) : (
          <>
            <div className="p-10 flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                type === 'delete' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'
              }`}>
                {type === 'delete' ? <Trash2 size={32} /> : <Pencil size={32} />}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 leading-tight mb-3">
                {title}
              </h3>
              
              <p className="text-slate-500 font-medium text-sm px-2 mb-6">
                {description}
              </p>

              {type === 'rename' && (
                <div className="w-full px-2">
                  <input
                    autoFocus
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Novo nome..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  />
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 flex gap-3 mt-auto">
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isSubmitting || (type === 'rename' && (!value.trim() || value === initialValue))}
                className={`flex-[1.5] py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center text-white disabled:opacity-50 ${
                  type === 'delete' 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                    : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                }`}
              >
                {isSubmitting ? 'Processando...' : confirmLabel || 'Confirmar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
