import { useState, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, FileText, CheckCircle2, AlertCircle, Loader2, ClipboardList, TreePine, BarChart3, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { useAppStore, type ISALaudoData } from '../../store/useAppStore';
import {
  calcularRiscoISA,
  LABELS_PROB_FALHA, LABELS_PROB_IMPACTO, LABELS_CONSEQUENCIA, LABELS_LIMITANTE, LABELS_PARTE_ARVORE,
  OPCOES_MITIGACAO,
  type ProbabilidadeFalha, type ProbabilidadeImpacto, type Consequencia, type Limitante, type ParteArvore, type EntradaRisco
} from '../../lib/isaRiskEngine';
import { LaudoPDFTemplate } from './LaudoPDFTemplate';
import { getAIInterpretation } from '../../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoArbolia from '../../assets/logo_arbolia.png';

const DEFEITOS_OPCOES = [
  'Queima da casca','Galhos mortos e secos','Rachadura no tronco','Sinais de fungos ou podridão',
  'Inclinação acentuada','Colar da raiz enterrado','Raízes expostas ou danificadas',
  'Presença de ervas daninhas','Interferência com estruturas','Análise feita do solo',
];
const PROB_FALHA_OPTIONS: ProbabilidadeFalha[] = ['iminente','provavel','possivel','impossivel'];
const PROB_IMPACTO_OPTIONS: ProbabilidadeImpacto[] = ['alto','medio','baixo','muito_baixo'];
const CONSEQUENCIA_OPTIONS: Consequencia[] = ['severa','significante','minima','insignificante'];
const LIMITANTE_OPTIONS: Limitante[] = ['nenhum','visibilidade','acesso','ervas_daninhas','colar_enterrado'];

const STEP_ICONS = [ClipboardList, TreePine, BarChart3, ShieldCheck, FileText];
const STEP_TITLES = ['Alvos e Ocupação','Defeitos e Condições','Matrizes de Risco','Mitigação e Parecer', 'Estilo do Laudo'];

const COR_BADGE: Record<string, string> = { Baixo:'bg-green-100 text-green-800 border-green-300', Moderado:'bg-amber-100 text-amber-800 border-amber-300', Alto:'bg-red-100 text-red-800 border-red-300', Extremo:'bg-red-200 text-red-900 border-red-500' };

export function LaudoAvaliacaoModal() {
  const { isLaudoModalOpen, activeLaudoServiceId, closeLaudoModal, services, trees, clients, userProfile, saveLaudo } = useAppStore();

  const service = services.find(s => s.id === activeLaudoServiceId);
  const serviceTree = service && service.treeIds.length > 0 ? trees.find(t => t.id === service.treeIds[0]) : null;
  const cliente = serviceTree ? clients.find(c => c.id === serviceTree.cliente_id) : null;

  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<'standard' | 'safety' | 'health' | 'manager' | 'tecnico' | 'simplificado'>('simplificado');
  const [isGenerating, setIsGenerating] = useState(false);

  const [done, setDone] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<{ resumo_estado_geral: string, explicacao_mitigacao: string } | null>(null);

  interface AlvoState {
    id: string;
    alvo: string;
    parte: ParteArvore;
    condicoesPreocupantes: string;
    probFalha: ProbabilidadeFalha | '';
    probImpacto: ProbabilidadeImpacto | '';
    consequencia: Consequencia | '';
  }

  // Alvos (Etapas 1 e 3)
  const [alvos, setAlvos] = useState<AlvoState[]>([{
    id: '1', alvo: '', parte: 'tronco', condicoesPreocupantes: '',
    probFalha: '', probImpacto: '', consequencia: ''
  }]);
  const [descricaoLocal, setDescricaoLocal] = useState('');

  // Etapa 2
  const [defeitos, setDefeitos] = useState<string[]>([]);

  // Etapa 3 (Limitantes)
  const [limitantes, setLimitantes] = useState<Limitante[]>(['nenhum']);

  // Etapa 4
  const [mitigacoes, setMitigacoes] = useState<string[]>([]);
  const [parecer, setParecer] = useState<'final'|'preliminar'>('final');
  const [avaliacaoAvancada, setAvaliacaoAvancada] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  const pdfRef = useRef<HTMLDivElement>(null);

  const canNext0 = alvos.every(a => a.alvo.trim().length > 0);
  const canNext2 = alvos.every(a => a.probFalha && a.probImpacto && a.consequencia);

  const resultado = canNext2
    ? calcularRiscoISA(alvos as EntradaRisco[])
    : null;



  const toggleDef = (d: string) => setDefeitos(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d]);
  const toggleMit = (id: string) => setMitigacoes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const toggleLim = (l: Limitante) => {
    if (l==='nenhum') { setLimitantes(['nenhum']); return; }
    setLimitantes(p => { const s = p.filter(x=>x!=='nenhum'); return s.includes(l)?s.filter(x=>x!==l):[...s,l]; });
  };

  const addAlvo = () => setAlvos(p => [...p, {
    id: `alvo-${crypto.randomUUID()}`, alvo: '', parte: 'tronco' as ParteArvore, condicoesPreocupantes: '',
    probFalha: '' as ProbabilidadeFalha | '', probImpacto: '' as ProbabilidadeImpacto | '', consequencia: '' as Consequencia | ''
  }]);
  const removeAlvo = (id: string) => setAlvos(p => p.length > 1 ? p.filter(a => a.id !== id) : p);
  const updateAlvo = (id: string, field: keyof AlvoState, value: string) =>
    setAlvos(p => p.map(a => a.id === id ? { ...a, [field]: value } : a));

  const handleReset = useCallback(() => {
    setStep(0); setIsGenerating(false); setDone(false);
    setAlvos([{ id: '1', alvo: '', parte: 'tronco', condicoesPreocupantes: '', probFalha: '', probImpacto: '', consequencia: '' }]);
    setDescricaoLocal('');
    setDefeitos([]); setLimitantes(['nenhum']); setMitigacoes([]); setParecer('final');
    setAvaliacaoAvancada(false); setObservacoes('');
  }, []);

  const handleClose = () => { closeLaudoModal(); setTimeout(handleReset, 300); };

  const handleGenerate = async () => {
    if (!resultado || !service) return;
    setIsGenerating(true);
    
    const laudo: ISALaudoData = {
      entradasRisco: alvos as EntradaRisco[],
      descricaoLocal, defeitos,
      limitantes, mitigacoesSelecionadas: mitigacoes,
      parecer, avaliacaoAvancada, observacoes, resultado,
      tecnicoNome: userProfile?.nome || 'Técnico Responsável',
      tecnicoCrea: userProfile?.crea || 'CREA-XX 000000',
      dataLaudo: new Date().toISOString(),
    };

    try {

    // ── INTERPRETAÇÃO IA ───────────────────────────────────────────────
    try {
      const mitigacoesLabels = mitigacoes.map(id => OPCOES_MITIGACAO.find(o => o.id === id)?.label).filter((l): l is string => Boolean(l));
      const aiResponse = await getAIInterpretation({
        especie: serviceTree?.especie || 'Árvore',
        defeitos,
        risco_geral: resultado.classificacaoGeral,
        mitigacoes_sugeridas: mitigacoesLabels,
        observacoes_tecnicas: observacoes
      });
      
      if (aiResponse) {
        laudo.aiResumo = aiResponse;
        setAiInterpretation(aiResponse);
        console.log('Dados da IA injetados no laudo:', aiResponse);
      } else {
        console.warn('AI Response foi null, usando fallback técnico.');
      }
    } catch (err) {
      console.error('Falha na IA, continuando sem resumo:', err);
    }

    const loadLogo = (): Promise<string | null> => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000); // 5s timeout
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          clearTimeout(timeout);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        img.src = logoArbolia;
      });
    };

    const logoBase64 = await loadLogo();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = 20;

      const themes: Record<string, { primary: number[], secondary: number[], title: string, accent: number[], bg: number[] }> = {
        tecnico:      { primary: [15, 23, 42], secondary: [71, 85, 105], title: 'LAUDO TÉCNICO DE RISCO (ISA TRAQ)', accent: [51, 65, 85], bg: [248, 250, 252] },
        simplificado: { primary: [22, 101, 52], secondary: [71, 85, 105], title: 'RELATÓRIO DE SEGURANÇA E MANUTENÇÃO', accent: [34, 197, 94], bg: [240, 253, 244] }
      }
      const selectedId = 'simplificado';
      const theme = themes[selectedId];


      // Logo Real (Expandido, pois contém o nome da empresa)
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', margin, 12, 50, 20);
        } catch (e) {
          console.error('Erro ao adicionar imagem no PDF:', e);
          doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
          doc.roundedRect(margin, 12, 10, 10, 2, 2, 'F');
        }
      } else {
        doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
        doc.roundedRect(margin, 12, 10, 10, 2, 2, 'F');
      }

      // Badge de CREA (Responsável Técnico)
      const badgeWidth = 60;
      const badgeX = pageWidth - margin - badgeWidth;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(badgeX, 10, badgeWidth, 18, 2, 2, 'FD');
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('RESPONSÁVEL TÉCNICO', badgeX + 4, 15);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.text(userProfile?.nome || 'Técnico Responsável', badgeX + 4, 20);
      
      doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.setFontSize(7);
      doc.text(userProfile?.crea || 'CREA-XX 000000', badgeX + 4, 24);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.text(theme.title, pageWidth - margin, 34, { align: 'right' });
      
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`${new Date().toLocaleDateString('pt-BR')} • Ref: ${laudo.dataLaudo.split('T')[0].replace(/-/g, '')}`, pageWidth - margin, 38, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, 42, pageWidth - margin, 42);

      y = 50;

      // ── RESUMO DINÂMICO ────────────────────────────────────────────────
      const rColor = resultado.classificacaoGeral === 'Extremo' ? [153, 27, 27] : 
                     resultado.classificacaoGeral === 'Alto' ? [220, 38, 38] :
                     resultado.classificacaoGeral === 'Moderado' ? [217, 119, 6] : [22, 163, 74];
      
      // Card de Risco
      doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
      doc.setDrawColor(rColor[0], rColor[1], rColor[2]);
      doc.roundedRect(margin, y, 65, 35, 4, 4, 'F');
      doc.roundedRect(margin, y, 65, 35, 4, 4, 'D');
      
      doc.setTextColor(theme.secondary[0], theme.secondary[1], theme.secondary[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('NÍVEL DE RISCO GERAL', margin + 5, y + 8);
      
      doc.setTextColor(rColor[0], rColor[1], rColor[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(resultado.classificacaoGeral.toUpperCase(), margin + 5, y + 20);
      
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(resultado.metadataGeral.descricao, margin + 5, y + 28, { maxWidth: 55 });

      // Narrativa Personalizada (ou IA)
      const getNarrativeText = () => {
        if (laudo.aiResumo?.resumo_estado_geral) {
          return laudo.aiResumo.resumo_estado_geral;
        }
        
        const risk = resultado.classificacaoGeral;
        const defs = defeitos.slice(0, 2).join(', ').toLowerCase();
        if (risk === 'Extremo' || risk === 'Alto') {
          return `ATENÇÃO CRÍTICA: Identificamos condições severas ${defs ? `(${defs})` : ''} que representam risco imediato. A execução das mitigações recomendadas é prioritária para garantir a segurança no local e evitar danos severos.`;
        }
        if (risk === 'Moderado') {
          return `MANUTENÇÃO PREVENTIVA: A árvore apresenta sinais de atenção ${defs ? `(${defs})` : ''} que requerem acompanhamento. A aplicação das recomendações irá reduzir a probabilidade de falhas e aumentar a segurança.`;
        }
        return `MONITORAMENTO: O exemplar apresenta vigor e estabilidade satisfatórios. Não foram detectados defeitos críticos que exijam intervenção imediata. Recomendamos manter o plano de monitoramento anual.`;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO DA ANÁLISE', margin + 75, y + 8);
      
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(getNarrativeText(), margin + 75, y + 15, { maxWidth: pageWidth - margin * 2 - 80, align: 'justify' });

      y += 45;

      // ── GRID DE INFORMAÇÕES ────────────────────────────────────────────
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        body: [
          ['ESPÉCIE:', especie, 'CLIENTE:', clienteNome],
          ['TÉCNICO:', userProfile?.nome || 'Técnico', 'PARECER:', parecer === 'final' ? 'FINAL' : 'PRELIMINAR']
        ],
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 3, fillColor: [248, 250, 252] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 }, 2: { fontStyle: 'bold', cellWidth: 25 } }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 12;

      // ── TABELA DE ALVOS ────────────────────────────────────────────────
      doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DE ALVOS E RISCOS LOCAIS', margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['O QUE PODE SER ATINGIDO?', 'PARTE DA ÁRVORE', 'NÍVEL DE RISCO']],
        body: alvos.map((a, i) => [
          a.alvo || 'Área de entorno',
          LABELS_PARTE_ARVORE[a.parte as keyof typeof LABELS_PARTE_ARVORE],
          resultado.riscos[i].classificacao.toUpperCase()
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: theme.primary as [number, number, number], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.text[0];
            if (val === 'EXTREMO' || val === 'ALTO') data.cell.styles.textColor = [153, 27, 27];
            if (val === 'MODERADO') data.cell.styles.textColor = [217, 119, 6];
          }
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 12;

      // ── RECOMENDAÇÕES ──────────────────────────────────────────────────
      doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PLANO DE AÇÃO E MITIGAÇÃO', margin, y);
      y += 4;

      if (mitigacoes.length > 0) {
        resultado.riscos[0].riscoResidualPorMitigacao
          .filter(m => mitigacoes.includes(m.mitigacao.id))
          .forEach(m => {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');
            
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`AÇÃO: ${m.mitigacao.label}`, margin + 5, y + 6);
            
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`Objetivo: Reduzir a probabilidade de falha e o risco residual para ${m.classificacao.toUpperCase()}.`, margin + 5, y + 10);
            
            y += 18;
          });

        if (laudo.aiResumo?.explicacao_mitigacao) {
          y += 4;
          doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
          doc.rect(margin, y, pageWidth - margin * 2, 25, 'F');
          
          doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('INTERPRETAÇÃO DAS RECOMENDAÇÕES (IA)', margin + 5, y + 7);
          
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(laudo.aiResumo.explicacao_mitigacao, margin + 5, y + 13, { maxWidth: pageWidth - margin * 2 - 10, align: 'justify' });
          y += 35;
        }
      } else {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text('Nenhuma intervenção crítica necessária no momento.', margin, y + 5);
      }

      // Rodapé
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('ARBOLIA® ARBORICULTURA - INTELIGÊNCIA EM GESTÃO DE RISCO ARBÓREO', pageWidth / 2, 285, { align: 'center' });
      doc.text('PADRÃO INTERNACIONAL ISA TRAQ - DOCUMENTO AUTENTICADO ELETRONICAMENTE', pageWidth / 2, 289, { align: 'center' });

      // FINALIZAR E SALVAR DIRETAMENTE EM BASE64 NO FIRESTORE (100% OFFLINE E Spark-friendly)
      const attachmentId = `laudo-${crypto.randomUUID()}`;
      const dataUrl = doc.output('datauristring');
      const attachmentName = `Laudo ISA — ${new Date().toLocaleDateString('pt-BR')}.pdf`;
      const attachmentSize = Math.round(dataUrl.length * 0.75);

      const prev = service.attachmentsByTree ?? {};
      const nextAttachments = { ...prev };
      service.treeIds.forEach(tId => {
        nextAttachments[tId] = [...(prev[tId] ?? []), {
          id: attachmentId,
          name: attachmentName,
          type: 'pdf' as const,
          storagePath: dataUrl, // Salva o Base64 diretamente no storagePath para visualização offline direta
          size: attachmentSize,
        }];
      });

      await saveLaudo(service.id, laudo, nextAttachments);

      setIsGenerating(false);
      setDone(true);

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (e) {
      console.error('Erro fatal na geração do PDF:', e);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isLaudoModalOpen || !service) return null;

  const especie = serviceTree?.especie ?? 'Árvore';
  const clienteNome = cliente?.nome ?? 'Cliente não identificado';

  const StepIcon = STEP_ICONS[step];

  return (
    <>
      {pdfRef && (
        <LaudoPDFTemplate ref={pdfRef} laudo={{
          entradasRisco: alvos as EntradaRisco[],
          descricaoLocal, defeitos,
          limitantes, mitigacoesSelecionadas:mitigacoes,
          parecer, avaliacaoAvancada, observacoes,
          resultado: resultado ?? calcularRiscoISA(alvos.map(a => ({
            alvo: a.alvo || 'Alvo', 
            parte: a.parte, 
            probFalha: (a.probFalha || 'impossivel') as ProbabilidadeFalha, 
            probImpacto: (a.probImpacto || 'muito_baixo') as ProbabilidadeImpacto, 
            consequencia: (a.consequencia || 'insignificante') as Consequencia 
          }))),
          tecnicoNome: userProfile?.nome || 'Técnico', tecnicoCrea: userProfile?.crea || 'CREA-XX',
          dataLaudo:new Date().toISOString(),
          aiResumo: aiInterpretation || undefined
        }} especie={especie} cliente={clienteNome} templateId={templateId as 'tecnico' | 'simplificado'} />
      )}

      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={done ? handleClose : undefined} />

        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={{maxHeight:'90vh'}}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-sm">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Laudo de Avaliação de Risco ISA</h2>
                <p className="text-xs text-slate-500">{especie} · {clienteNome}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/60 rounded-full transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Step indicator */}
          {!done && (
            <div className="px-6 pt-4 pb-0 shrink-0">
              <div className="flex items-center gap-2">
                {STEP_TITLES.map((t,i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-1.5 ${i===step?'text-emerald-600':'i<step?text-slate-400:text-slate-300'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i<step?'bg-emerald-500 text-white':i===step?'bg-emerald-500 text-white':'bg-slate-100 text-slate-400'}`}>{i<step?'✓':i+1}</div>
                      <span className={`text-[10px] font-bold hidden sm:block ${i===step?'text-emerald-700':'text-slate-400'}`}>{t}</span>
                    </div>
                    {i<3 && <div className={`flex-1 h-0.5 ${i<step?'bg-emerald-400':'bg-slate-100'}`} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {done && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Relatório Anexado!</h3>
              </div>
            )}
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg"><StepIcon size={16}/></div>
              <h3 className="font-bold text-slate-800">{STEP_TITLES[step]}</h3>
            </div>

                {/* ── ETAPA 0: Alvos ── */}
                {step===0 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-slate-500">Cadastre os alvos que serão avaliados para esta árvore. Cada alvo terá sua avaliação de risco individual.</p>

                    {alvos.map((alvo, idx) => (
                      <div key={alvo.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Alvo {idx + 1}</span>
                          {alvos.length > 1 && (
                            <button onClick={() => removeAlvo(alvo.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição do Alvo</label>
                            <input
                              value={alvo.alvo}
                              onChange={e => updateAlvo(alvo.id, 'alvo', e.target.value)}
                              placeholder="Ex: Galpão, Rede Elétrica, Via Pública..."
                              className="w-full mt-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parte da Árvore</label>
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              {(['copa','galhos','tronco','raiz_base'] as ParteArvore[]).map(p => (
                                <button key={p} onClick={() => updateAlvo(alvo.id, 'parte', p)}
                                  className={`px-3 py-2 rounded-xl border text-sm font-medium text-left transition-all ${alvo.parte===p ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                  {LABELS_PARTE_ARVORE[p]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condições preocupantes (opcional)</label>
                            <input
                              value={alvo.condicoesPreocupantes}
                              onChange={e => updateAlvo(alvo.id, 'condicoesPreocupantes', e.target.value)}
                              placeholder="Rachadura, fungo, inclinação..."
                              className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button onClick={addAlvo} className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all hover:bg-emerald-50/30">
                      <Plus size={16} /> Adicionar Alvo
                    </button>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição do Local (opcional)</label>
                      <textarea value={descricaoLocal} onChange={e=>setDescricaoLocal(e.target.value)} rows={2} placeholder="Descreva a localização, contexto e características relevantes..." className="w-full mt-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                  </div>
                )}

                {/* ── ETAPA 1: Defeitos ── */}
                {step===1 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-3">Selecione todas as condições observadas durante a vistoria.</p>
                    <div className="flex flex-wrap gap-2">
                      {DEFEITOS_OPCOES.map(d=>(
                        <button key={d} onClick={()=>toggleDef(d)} className={`px-3 py-2 rounded-full border text-sm font-medium transition-all ${defeitos.includes(d)?'bg-red-50 border-red-300 text-red-700':'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          {defeitos.includes(d)?'✓ ':''}{d}
                        </button>
                      ))}
                    </div>
                    {defeitos.length===0 && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
                        <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                        <span>Nenhum defeito registrado. Você pode avançar se nenhum foi observado.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ETAPA 2: Matrizes ── */}
                {step===2 && (
                  <div className="flex flex-col gap-6">
                    <p className="text-xs text-slate-500">Avalie os riscos para cada alvo cadastrado cruzando as probabilidades e consequências.</p>
                    
                    <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-2">
                      {alvos.map((alvo, idx) => (
                        <div key={alvo.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                            <span className="text-sm font-bold text-slate-700">{alvo.alvo || 'Sem descrição'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">({LABELS_PARTE_ARVORE[alvo.parte]})</span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">1. Probabilidade de Falha</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {PROB_FALHA_OPTIONS.map(v => (
                                  <button key={v} onClick={() => updateAlvo(alvo.id, 'probFalha', v)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${alvo.probFalha===v ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                    {LABELS_PROB_FALHA[v]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">2. Probabilidade de Impacto</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {PROB_IMPACTO_OPTIONS.map(v => (
                                  <button key={v} onClick={() => updateAlvo(alvo.id, 'probImpacto', v)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${alvo.probImpacto===v ? 'bg-amber-50 border-amber-400 text-amber-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                    {LABELS_PROB_IMPACTO[v]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">3. Consequências</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {CONSEQUENCIA_OPTIONS.map(v => (
                                  <button key={v} onClick={() => updateAlvo(alvo.id, 'consequencia', v)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${alvo.consequencia===v ? 'bg-purple-50 border-purple-400 text-purple-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                    {LABELS_CONSEQUENCIA[v]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limitantes da Inspeção</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LIMITANTE_OPTIONS.map(v=>(
                          <button key={v} onClick={()=>toggleLim(v)} className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${limitantes.includes(v)?'bg-slate-800 border-slate-800 text-white':'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{LABELS_LIMITANTE[v]}</button>
                        ))}
                      </div>
                    </div>

                    {resultado && (
                      <div className={`rounded-2xl border p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${COR_BADGE[resultado.classificacaoGeral]}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Risco Crítico Agregado</div>
                          <ShieldCheck size={14} className="opacity-70" />
                        </div>
                        <div className="text-2xl font-black">{resultado.classificacaoGeral}</div>
                        <div className="text-xs mt-1 opacity-80 leading-tight">{resultado.metadataGeral.descricao}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ETAPA 3: Mitigação ── */}
                {step===3 && (
                  <div className="flex flex-col gap-5">
                    {resultado && (
                      <div className="flex gap-3">
                        <div className={`flex-1 rounded-2xl border p-4 ${COR_BADGE[resultado.classificacaoGeral]}`}>
                          <div className="text-xs font-bold uppercase tracking-wider opacity-70">Risco atual</div>
                          <div className="text-2xl font-black">{resultado.classificacaoGeral}</div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ações de Mitigação Recomendadas</label>
                      <p className="text-xs text-slate-400 mt-0.5 mb-3">Selecione as ações aplicáveis. O risco residual é calculado automaticamente com base no alvo de maior risco.</p>
                      <div className="flex flex-col gap-2">
                        {resultado && (resultado.riscos.find(r => r.classificacao === resultado.classificacaoGeral) || resultado.riscos[0]).riscoResidualPorMitigacao.map(m=>(
                          <button key={m.mitigacao.id} onClick={()=>toggleMit(m.mitigacao.id)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${mitigacoes.includes(m.mitigacao.id)?'bg-emerald-50 border-emerald-300 shadow-sm':'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="flex flex-col text-left">
                              <span className={`text-sm font-bold ${mitigacoes.includes(m.mitigacao.id)?'text-emerald-700':'text-slate-700'}`}>{m.mitigacao.label}</span>
                              <span className="text-[10px] text-slate-400 italic">Reduz para {m.classificacao}</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${mitigacoes.includes(m.mitigacao.id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div>
                        <div className="text-sm font-bold text-blue-800">Avaliação Avançada</div>
                        <div className="text-xs text-blue-500">Requer inspeção por instrumento especializado</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={avaliacaoAvancada} onChange={e=>setAvaliacaoAvancada(e.target.checked)} />
                        <div className="w-11 h-6 bg-blue-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observações Técnicas (opcional)</label>
                      <textarea value={observacoes} onChange={e=>setObservacoes(e.target.value)} rows={3} placeholder="Observações adicionais para o relatório..." className="w-full mt-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                  </div>
                )}

                {/* ── ETAPA 4: Estilo do Laudo ── */}
                {step===4 && (
                  <div className="flex flex-col gap-6">
                    <p className="text-xs text-slate-500">Selecione o modelo de relatório para geração.</p>
                    
                    <div className="flex flex-col gap-4">
                      {[
                        { id: 'simplificado', label: 'Relatório Simplificado', desc: 'Narrativa interpretativa e linguagem acessível para o cliente.', icon: <ShieldCheck size={20} /> }
                      ].map(opt => (
                        <button 
                          key={opt.id} 
                          onClick={() => setTemplateId(opt.id as 'tecnico' | 'simplificado')}
                          className={`flex items-center gap-5 p-6 rounded-2xl border-2 transition-all text-left ${templateId === opt.id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${templateId === opt.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {opt.icon}
                          </div>
                          <div className="flex-1">
                            <span className="text-base font-bold block text-slate-900">{opt.label}</span>
                            <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${templateId === opt.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'}`}>
                            {templateId === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-white shrink-0">
            <div className="flex gap-3">
              {step>0 && (
                <button onClick={()=>setStep(s=>s-1)} className="flex items-center gap-1.5 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <ChevronLeft size={15}/> Anterior
                </button>
              )}
              {step<4 ? (
                <button onClick={()=>setStep(s=>s+1)} disabled={step===0?!canNext0:step===2?!canNext2:false}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all ${(step===0?canNext0:step===2?canNext2:true)?'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20':'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                  Próximo <ChevronRight size={15}/>
                </button>
              ) : (
                <button onClick={handleGenerate} disabled={isGenerating || done || !canNext2}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all shadow-md disabled:bg-slate-100 disabled:text-slate-300 ${
                    done ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  }`}>
                  {isGenerating ? <><Loader2 size={16} className="animate-spin"/> Gerando PDF...</> : done ? <><CheckCircle2 size={16}/> Gerado e Anexado!</> : <><FileText size={16}/> Gerar e Salvar Relatório</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
