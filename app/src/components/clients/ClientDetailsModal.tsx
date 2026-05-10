import { useState } from 'react';
import { X, Building2, FileText, Mail, Phone, MapPin, Trees, Calendar, ShieldCheck, Activity, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function ClientDetailsModal() {
  const { isClientDetailsModalOpen, viewingClientDetailsId, clients, trees, services, closeClientDetailsModal } = useAppStore();
  const [activeView, setActiveView] = useState<'details' | 'trees' | 'services'>('details');
  
  if (!isClientDetailsModalOpen || !viewingClientDetailsId) return null;

  const client = clients.find(c => c.id === viewingClientDetailsId);
  if (!client) return null;

  const clientTrees = trees.filter(t => t.cliente_id === client.id);
  const clientTreeIds = clientTrees.map(t => t.id);
  const clientServices = services.filter(s => s.treeIds.some(id => clientTreeIds.includes(id))).sort((a, b) => new Date(b.data + 'T00:00:00').getTime() - new Date(a.data + 'T00:00:00').getTime());

  const handleClose = () => {
    setActiveView('details');
    closeClientDetailsModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
      
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-lg relative z-10 overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {activeView !== 'details' && (
              <button onClick={() => setActiveView('details')} className="p-1.5 bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors mr-1">
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
              {activeView === 'trees' ? <Trees size={20} /> : activeView === 'services' ? <Activity size={20} /> : <Building2 size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
                {activeView === 'details' ? client.nome : activeView === 'trees' ? 'Árvores Gerenciadas' : 'Histórico de Serviços'}
              </h2>
              {activeView === 'details' && (
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md mt-0.5 inline-block ${
                  client.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {client.status}
                </span>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/30 overflow-y-auto flex flex-col gap-4">
          
          {activeView === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12} /> Documento</span>
                  <span className="font-mono text-slate-700 text-sm">{client.documento}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Cliente Desde</span>
                  <span className="font-bold text-slate-700 text-sm">{new Date(client.data_cadastro).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2"><ShieldCheck size={12} /> Contato & Endereço</span>
                <div className="flex flex-col gap-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /> {client.email}</div>
                  <div className="flex items-center gap-2"><Phone size={16} className="text-slate-400" /> {client.telefone}</div>
                  {client.endereco ? (
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {client.endereco}</div>
                  ) : (
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-200" /> <span className="text-slate-400 italic">Endereço não cadastrado</span></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => setActiveView('trees')}
                  className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 transition-colors group cursor-pointer"
                >
                  <Trees size={24} className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-black text-emerald-700 leading-none">{clientTrees.length}</span>
                  <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Árvores Gerenciadas</span>
                </button>
                <button 
                  onClick={() => setActiveView('services')}
                  className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-blue-100 transition-colors group cursor-pointer"
                >
                  <Activity size={24} className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-black text-blue-700 leading-none">{clientServices.length}</span>
                  <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider">Histórico de Serviços</span>
                </button>
              </div>
            </>
          )}

          {activeView === 'trees' && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-right-4 duration-200">
              {clientTrees.length === 0 ? (
                <div className="text-center text-slate-400 py-8 bg-white rounded-2xl border border-slate-100 border-dashed text-sm">
                  Nenhuma árvore vinculada a este cliente.
                </div>
              ) : (
                clientTrees.map(tree => (
                  <div key={tree.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-sm">{tree.especie}</h4>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        tree.status_risco === 'baixo' ? 'bg-emerald-100 text-emerald-700' :
                        tree.status_risco === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                        tree.status_risco === 'alto' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tree.status_risco}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Altura: <strong className="text-slate-700">{tree.altura}m</strong></span>
                      <span>Copa: <strong className="text-slate-700">{tree.tamanho_copa}m</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeView === 'services' && (
            <div className="relative pl-4 border-l-2 border-slate-100 ml-2 py-2 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-200">
              {clientServices.length === 0 ? (
                <div className="text-center text-slate-400 py-8 bg-white rounded-2xl border border-slate-100 border-dashed text-sm -ml-6">
                  Nenhum serviço registrado para este cliente.
                </div>
              ) : (
                clientServices.map((service) => (
                  <div key={service.id} className="relative">
                    {/* Linha do tempo dot */}
                    <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      service.status === 'concluido' ? 'bg-emerald-500' :
                      service.status === 'agendado' ? 'bg-blue-500' : 'bg-red-500'
                    }`}></div>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{service.tipo}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          service.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          service.status === 'agendado' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Responsável:</span>
                          <strong className="text-slate-700">{service.responsavel}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Agendada:</span>
                          <strong className="text-slate-700">{new Date(service.data + 'T00:00:00').toLocaleDateString()}{service.horario && ` às ${service.horario}`}</strong>
                        </div>
                        <div className="flex justify-between mt-1 pt-1 border-t border-slate-50">
                          <span>Árvores Envolvidas:</span>
                          <strong className="text-slate-700">{service.treeIds.length}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
