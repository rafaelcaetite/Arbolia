import { useState } from 'react';
import { X, Mail, MessageCircle, Send, CheckCircle2, Bell, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function ReminderModal() {
  const { isReminderModalOpen, activeReminderServiceId, services, trees, clients, closeReminderModal } = useAppStore();
  const [sent, setSent] = useState(false);
  // Agora é um Set — múltiplos canais podem ser selecionados simultaneamente
  const [selectedChannels, setSelectedChannels] = useState<Set<'email' | 'whatsapp'>>(new Set(['whatsapp']));

  const [prevIsOpen, setPrevIsOpen] = useState(isReminderModalOpen);

  if (isReminderModalOpen !== prevIsOpen) {
    setPrevIsOpen(isReminderModalOpen);
    if (isReminderModalOpen) {
      setSent(false);
      setSelectedChannels(new Set(['whatsapp']));
    }
  }

  if (!isReminderModalOpen || !activeReminderServiceId) return null;

  const service = services.find(s => s.id === activeReminderServiceId);
  if (!service) return null;

  // Todos os clientes únicos vinculados às árvores do serviço
  const involvedTrees = trees.filter(t => service.treeIds.includes(t.id));
  const ownerIds = new Set(involvedTrees.map(t => t.cliente_id).filter(Boolean) as string[]);
  const recipients = [...ownerIds].map(id => clients.find(c => c.id === id)).filter(Boolean) as typeof clients;

  const toggleChannel = (channel: 'email' | 'whatsapp') => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channel)) {
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  };

  const canSend = selectedChannels.size > 0 && recipients.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setSent(true);
    setTimeout(() => {
      closeReminderModal();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={sent ? undefined : closeReminderModal}
      />

      <div className={`rounded-3xl shadow-2xl w-full max-w-sm relative z-10 flex flex-col transform transition-all duration-300 ${
        sent ? 'bg-emerald-500' : 'bg-white'
      }`}>

        {!sent ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight">Emitir Aviso</h2>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Serviço de {service.tipo} · {new Date(service.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {service.horario && ` às ${service.horario.slice(0, 5)}`}
                  </span>
                </div>
              </div>
              <button
                onClick={closeReminderModal}
                className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* Destinatários */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Destinatário{recipients.length !== 1 ? 's' : ''}
                </span>

                {recipients.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum cliente vinculado às árvores deste serviço.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {recipients.map(client => (
                      <div key={client.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                        {/* Badge do nome */}
                        <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] px-2.5 py-1 rounded-md font-semibold shadow-sm w-fit">
                          <User size={10} className="text-slate-400" />
                          {client.nome}
                        </div>

                        {/* Dados de contato */}
                        <div className="flex flex-col gap-1 pl-1">
                          {client.telefone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MessageCircle size={12} className="text-[#25D366] shrink-0" />
                              <span className="font-medium">{client.telefone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Mail size={12} className="text-blue-400 shrink-0" />
                              <span className="font-medium truncate">{client.email}</span>
                            </div>
                          )}
                          {!client.telefone && !client.email && (
                            <p className="text-[11px] text-slate-400 italic">Sem dados de contato cadastrados.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Canais — multi-seleção */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Canais de Envio
                  <span className="ml-1.5 text-[10px] normal-case font-medium text-slate-300">(selecione um ou mais)</span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleChannel('whatsapp')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                      selectedChannels.has('whatsapp')
                        ? 'border-[#25D366] bg-[#25D366]/8 text-[#25D366] shadow-sm'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <MessageCircle size={22} />
                    <span className="text-xs font-bold">WhatsApp</span>
                    {selectedChannels.has('whatsapp') && (
                      <CheckCircle2 size={12} className="text-[#25D366] -mt-1" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleChannel('email')}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                      selectedChannels.has('email')
                        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <Mail size={22} />
                    <span className="text-xs font-bold">E-mail</span>
                    {selectedChannels.has('email') && (
                      <CheckCircle2 size={12} className="text-blue-500 -mt-1" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão Enviar */}
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl shadow-md transition-all ${
                  canSend
                    ? 'bg-slate-800 hover:bg-slate-900 text-white active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
                Enviar via {[...(selectedChannels.has('whatsapp') ? ['WhatsApp'] : []), ...(selectedChannels.has('email') ? ['E-mail'] : [])].join(' + ') || '...'}
              </button>
            </div>
          </>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-white text-center animate-in zoom-in-95 duration-300">
            <CheckCircle2 size={64} className="mb-4 animate-bounce" />
            <h2 className="text-2xl font-black tracking-tight mb-2">Enviado!</h2>
            <p className="text-emerald-100 text-sm font-medium">
              Lembrete disparado com sucesso via{' '}
              {[...(selectedChannels.has('whatsapp') ? ['WhatsApp'] : []), ...(selectedChannels.has('email') ? ['E-mail'] : [])].join(' e ')}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
