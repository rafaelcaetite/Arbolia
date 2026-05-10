import React from 'react';
import { LaudoPDFTemplate } from './LaudoPDFTemplate';
import type { ISALaudoData } from '../../store/useAppStore';

const MOCK_LAUDO: ISALaudoData = {
  entradasRisco: [
    { alvo: 'Rede Elétrica de Alta Tensão', parte: 'copa', probabilidadeFalha: 'provavel', probabilidadeImpacto: 'alta', consequencia: 'grave' },
    { alvo: 'Calçada e Pedestres', parte: 'tronco', probabilidadeFalha: 'improvel', probabilidadeImpacto: 'baixa', consequencia: 'menor' }
  ],
  defeitos: ['Cavidade basal extensa', 'Inclinação acentuada', 'Presença de fungos'],
  limitantes: ['Acesso restrito', 'Tráfego intenso'],
  mitigacoesSelecionadas: ['poda-equilibrio', 'instalacao-cabos'],
  parecer: 'final',
  avaliacaoAvancada: true,
  observacoes: 'Árvore de grande porte com sinais de declínio estrutural. Intervenção necessária em até 30 dias.',
  resultado: {
    classificacaoGeral: 'Alto',
    metadataGeral: { 
      descricao: 'O risco é considerado ELEVADO devido à combinação de probabilidade de falha da copa e o alto valor do alvo (rede elétrica).' 
    },
    riscos: [
      { 
        classificacao: 'Alto', 
        riscoResidualPorMitigacao: [
          { mitigacao: { id: 'poda-equilibrio', label: 'Poda de Equilíbrio' }, classificacao: 'Moderado' },
          { mitigacao: { id: 'instalacao-cabos', label: 'Instalação de Cabos' }, classificacao: 'Moderado' }
        ] 
      },
      { classificacao: 'Baixo', riscoResidualPorMitigacao: [] }
    ]
  },
  tecnicoNome: 'Rafael Caetité',
  tecnicoCrea: 'CREA-BA 123.456/D',
  dataLaudo: new Date().toISOString()
};

export const TemplateGallery: React.FC = () => {
  return (
    <div className="p-10 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Galeria de Templates Arbolia</h1>
          <p className="text-slate-400">Visualize abaixo os 4 estilos visuais disponíveis para os laudos ISA TRAQ.</p>
        </header>

        <div className="grid grid-cols-1 gap-20">
          <TemplateSection id="tecnico" title="Padrão Técnico (B2B / Auditoria)" description="Exposição detalhada de matrizes ISA TRAQ, dados quantitativos e cálculos de risco para profissionais e órgãos reguladores." />
          <TemplateSection id="simplificado" title="Versão Simplificada (B2C / Educacional)" description="Narrativa traduzida para o cliente final, com foco em segurança, benefícios e recomendações práticas." />
        </div>
      </div>
    </div>
  );
};

const TemplateSection: React.FC<{ id: 'tecnico' | 'simplificado'; title: string; description: string }> = ({ id, title, description }) => {
  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 overflow-hidden">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400">{description}</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl relative mx-auto" style={{ width: '794px', transform: 'scale(0.9)', transformOrigin: 'top center' }}>
        <div className="laudo-preview-wrapper">
          <LaudoPDFTemplate 
            laudo={MOCK_LAUDO} 
            templateId={id} 
            especie="Tipuana tipu" 
            cliente="Condomínio Vila Verde" 
            ref={null as any}
          />
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .laudo-preview-wrapper #laudo-pdf-root { 
            position: relative !important; 
            left: 0 !important; 
            top: 0 !important;
            box-shadow: none !important;
          }
        `}} />
      </div>
    </section>
  );
};
