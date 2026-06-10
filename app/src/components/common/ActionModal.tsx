import { useState } from 'react';
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
  const [value, setValue] = useState('');
  const [extension, setExtension] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);

  if (isOpen !== prevIsOpen || initialValue !== prevInitialValue) {
    setPrevIsOpen(isOpen);
    setPrevInitialValue(initialValue);
    if (isOpen) {
      if (type === 'rename') {
        const lastDot = initialValue.lastIndexOf('.');
        if (lastDot !== -1) {
          setValue(initialValue.slice(0, lastDot));
          setExtension(initialValue.slice(lastDot));
        } else {
          setValue(initialValue);
          setExtension('');
        }
      } else {
        setValue(initialValue);
        setExtension('');
      }
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const finalValue = type === 'rename' ? `${value}${extension}` : undefined;
      await onConfirm(finalValue);
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
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all">
                    <input
                      autoFocus
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Novo nome..."
                      className="flex-1 px-5 py-4 bg-transparent text-sm font-bold focus:outline-none text-slate-700"
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                    {extension && (
                      <span className="bg-slate-100 px-4 py-4 text-xs font-black text-slate-400 border-l border-slate-100 uppercase tracking-widest">
                        {extension}
                      </span>
                    )}
                  </div>
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
