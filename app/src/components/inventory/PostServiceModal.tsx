import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Calendar, Clock, CheckCircle2, AlertTriangle, ChevronRight, Trees, FileText } from 'lucide-react';

// ── Motivos de supressão pré-definidos ────────────────────────────────────────
const MOTIVOS_SUPRESSAO = [
  'Risco estrutural iminente',
  'Doença ou praga irreversível',
  'Obra ou construção civil',
  'Interferência com rede elétrica',
  'Solicitação do proprietário',
  'Determinação judicial ou municipal',
  'Outro',
];

export function PostServiceModal() {
  const {
    isPostServiceModalOpen, activePostServiceId,
    closePostServiceModal, services, trees,
    completeService, deactivateTrees,
    openLaudoModal
  } = useAppStore();

  // ── Estado fluxo normal ────────────────────────────────────────────────────
  const [needsReavaliacao, setNeedsReavaliacao] = useState(false);
  const [reavaliacaoData, setReavaliacaoData] = useState('');
  const [reavaliacaoHora, setReavaliacaoHora] = useState('');
  const [cicloMeses, setCicloMeses] = useState<number | 'custom' | null>(12);
  const [customMeses, setCustomMeses] = useState('');

  // ── Estado fluxo supressão ─────────────────────────────────────────────────
  const [supressaoStep, setSupressaoStep] = useState<'confirm' | 'motivo' | 'done'>('confirm');
  const [motivoSelecionado, setMotivoSelecionado] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const service = services.find(s => s.id === activePostServiceId);
  const isSupressao = service?.tipo === 'Supressão';
  const isAvaliacao = service?.tipo === 'Avaliação';
  const laudoGerado = service?.laudoGerado ?? false;

  const validadeDateStr = useMemo(() => {
    if (!cicloMeses) return null;
    let m = cicloMeses === 'custom' ? parseInt(customMeses) || 0 : cicloMeses;
    if (m <= 0) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    return d.toISOString().split('T')[0];
  }, [cicloMeses, customMeses]);

  if (!isPostServiceModalOpen || !service) return null;

  const serviceTreeIds = service.treeIds;
  const serviceTreeNames = trees.filter(t => serviceTreeIds.includes(t.id)).map(t => t.especie);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNormalFinish = async () => {
    setIsSubmitting(true);
    try {
      // Para avaliações, a frequência de inspeção já foi calculada pelo ISA e o serviço principal concluído
      const finalReavaliacao = needsReavaliacao && reavaliacaoData
        ? `${reavaliacaoData}${reavaliacaoHora ? `T${reavaliacaoHora}` : ''}`
        : undefined;
        
      // Se for avaliação e tiver um laudo, usar a data de reavaliação sugerida pelo laudo como validade
      let finalValidade = validadeDateStr;
      if (isAvaliacao && service?.laudoData) {
        const dataLaudo = new Date(service.laudoData.dataLaudo);
        dataLaudo.setMonth(dataLaudo.getMonth() + service.laudoData.resultado.metadataGeral.frequenciaMeses);
        finalValidade = dataLaudo.toISOString().split('T')[0];
      }
      
      await completeService(service.id, finalReavaliacao, finalValidade || undefined);
      handleClose();
    } catch (e) {
      console.error(e);
      alert('Erro ao concluir serviço. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupressaoConfirm = async () => {
    const motivo = motivoSelecionado === 'Outro' ? motivoCustom.trim() : motivoSelecionado;
    if (!motivo) return;
    setIsSubmitting(true);
    try {
      await completeService(service.id);
      await deactivateTrees(serviceTreeIds, motivo);
      setSupressaoStep('done');
    } catch (e) {
      console.error(e);
      alert('Erro ao processar supressão. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleClose = () => {
    closePostServiceModal();
    // Reset tudo
    setNeedsReavaliacao(false);
    setReavaliacaoData('');
    setReavaliacaoHora('');
    setCicloMeses(12);
    setCustomMeses('');
    setSupressaoStep('confirm');
    setMotivoSelecionado('');
    setMotivoCustom('');
  };

  const motivoFinal = motivoSelecionado === 'Outro' ? motivoCustom.trim() : motivoSelecionado;
  const canConfirmSupressao = motivoFinal.length > 0;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={supressaoStep === 'done' ? handleClose : handleClose}
      />

      <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

        {/* ── FLUXO SUPRESSÃO ─────────────────────────────────────────── */}
        {isSupressao ? (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b border-red-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 text-red-600 p-2 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-800 tracking-tight">Supressão Concluída</h2>
                  <p className="text-xs text-red-500">
                    {serviceTreeNames.length === 1
                      ? serviceTreeNames[0]
                      : `${serviceTreeNames.length} árvores`}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                <X size={20} className="text-red-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-slate-50/30">

              {/* Step: Confirmar / Motivo */}
              {supressaoStep !== 'done' ? (
                <>
                  {/* Aviso */}
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <Trees size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-700">
                          {serviceTreeNames.length === 1 ? 'Esta árvore' : `Estas ${serviceTreeNames.length} árvores`} será{serviceTreeNames.length > 1 ? 'ão' : ''} marcada{serviceTreeNames.length > 1 ? 's' : ''} como <strong>inativa{serviceTreeNames.length > 1 ? 's' : ''}</strong>.
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          O histórico de serviços e anexos será preservado. O inventário as exibirá como suprimidas.
                        </p>
                      </div>
                    </div>
                    {serviceTreeNames.length > 1 && (
                      <ul className="pl-6 flex flex-col gap-0.5">
                        {serviceTreeNames.map((n, i) => (
                          <li key={i} className="text-xs text-red-600 font-medium">• {n}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Motivo */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-slate-700 text-sm">Motivo da Supressão</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Obrigatório para o registro técnico.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {MOTIVOS_SUPRESSAO.map(motivo => (
                        <button
                          key={motivo}
                          onClick={() => setMotivoSelecionado(motivo)}
                          className={`flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            motivoSelecionado === motivo
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {motivo}
                          {motivoSelecionado === motivo && <ChevronRight size={14} className="text-red-500" />}
                        </button>
                      ))}
                    </div>

                    {motivoSelecionado === 'Outro' && (
                      <textarea
                        placeholder="Descreva o motivo..."
                        value={motivoCustom}
                        onChange={e => setMotivoCustom(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all animate-in fade-in duration-200"
                      />
                    )}
                  </div>
                </>
              ) : (
                /* Step: Done */
                <div className="flex flex-col items-center justify-center flex-1 text-center gap-4 py-10">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Supressão Registrada</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {serviceTreeNames.length === 1
                        ? `${serviceTreeNames[0]} foi marcada como inativa.`
                        : `${serviceTreeNames.length} árvores foram marcadas como inativas.`}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 w-full">
                    <span className="font-bold text-slate-600">Motivo registrado:</span><br />
                    {motivoFinal}
                  </div>
                </div>
              )}
            </div>

            {/* Footer supressão */}
            {supressaoStep !== 'done' ? (
              <div className="p-6 border-t border-slate-100 bg-white flex flex-col gap-2">
                <button
                  onClick={handleSupressaoConfirm}
                  disabled={!canConfirmSupressao || isSubmitting}
                  className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    canConfirmSupressao && !isSubmitting
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  {isSubmitting ? 'Processando...' : 'Confirmar Supressão'}
                </button>

                <button
                  onClick={handleClose}
                  className="w-full bg-white hover:bg-slate-50 text-slate-500 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  onClick={handleClose}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            )}
          </>
        ) : (

        /* ── FLUXO NORMAL ─────────────────────────────────────────────── */
        <>
          <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Próximos Passos</h2>
              <p className="text-sm text-slate-500">Agende retornos e fidelize o cliente.</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-slate-50/30">

            {/* Pergunta 1: Reavaliação Técnica */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">Reavaliação Técnica?</h3>
                  <p className="text-xs text-slate-500">Voltar ao local para checar o serviço.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={needsReavaliacao}
                    onChange={e => setNeedsReavaliacao(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
              {needsReavaliacao && (
                <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} /> Data</label>
                    <input type="date" value={reavaliacaoData} onChange={e => setReavaliacaoData(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Hora</label>
                    <input type="time" value={reavaliacaoHora} onChange={e => setReavaliacaoHora(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                  </div>
                </div>
              )}
            </div>

            {/* Pergunta 2: Ciclo de Manutenção */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-slate-700 text-sm">Ciclo de Manutenção</h3>
                <p className="text-xs text-slate-500 mb-3">Estimativa para nova necessidade do serviço.</p>
                <div className="flex flex-wrap gap-2">
                  {[3, 6, 12].map(meses => (
                    <button key={meses} onClick={() => setCicloMeses(meses)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        cicloMeses === meses ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      {meses} meses
                    </button>
                  ))}
                  <button onClick={() => setCicloMeses('custom')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      cicloMeses === 'custom' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    Personalizado
                  </button>
                </div>
                {cicloMeses === 'custom' && (
                  <div className="mt-3 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <input type="number" min="1" placeholder="Ex: 24" value={customMeses} onChange={e => setCustomMeses(e.target.value)}
                      className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    <span className="text-sm font-medium text-slate-500">meses</span>
                  </div>
                )}
              </div>
              {validadeDateStr && (
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    O cliente será notificado para novo serviço na data projetada de{' '}
                    <strong className="text-slate-800">{new Date(validadeDateStr + 'T00:00:00').toLocaleDateString()}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row gap-3">
              {isAvaliacao && !laudoGerado && (
                <button
                  onClick={() => openLaudoModal(service.id)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <FileText size={18} /> Gerar Relatório
                </button>
              )}
              <button onClick={handleNormalFinish}
                disabled={(isAvaliacao && !laudoGerado) || isSubmitting}
                className={`flex-1 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  (isAvaliacao && !laudoGerado) || isSubmitting
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98] shadow-md shadow-emerald-500/20'
                }`}>
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {isSubmitting ? 'Salvando...' : 'Finalizar e Agendar Retorno'}
              </button>

            </div>
            
            {(!isAvaliacao || laudoGerado) && (
              <button onClick={() => { completeService(service.id); handleClose(); }}
                className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-500 font-bold py-3 px-4 rounded-xl transition-colors text-xs">
                Pular e apenas concluir
              </button>
            )}
            
            {isAvaliacao && !laudoGerado && (
              <button onClick={handleClose}
                className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-500 font-bold py-3 px-4 rounded-xl transition-colors text-xs">
                Cancelar
              </button>
            )}
          </div>
        </>
        )}
      </div>
    </div>
  );
}
