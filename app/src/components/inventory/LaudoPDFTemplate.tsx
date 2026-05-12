/**
 * LaudoPDFTemplate.tsx
 *
 * Componente React "invisível" — renderiza fora da viewport para servir de
 * fonte DOM ao html2pdf.js. Gera um documento PDF profissional focado no
 * cliente final (leigo), sem expor as matrizes de cálculo.
 *
 * Arquitetura: o blob gerado pelo html2pdf.js é convertido em base64 e
 * armazenado via addServiceAttachment. A migração para Supabase Storage
 * consiste apenas em trocar o destino final do blob.
 */

import { forwardRef } from 'react'
import type { ISALaudoData } from '../../store/useAppStore'
import { LABELS_PARTE_ARVORE } from '../../lib/isaRiskEngine'
import { ShieldCheck, ShieldAlert, ShieldQuestion, MapPin, TreeDeciduous, User, Info } from 'lucide-react'
import logoArbolia from '../../assets/logo_arbolia.png'

interface Props {
  laudo: ISALaudoData
  especie: string
  cliente: string
  templateId: 'tecnico' | 'simplificado'
}

export const LaudoPDFTemplate = forwardRef<HTMLDivElement, Props>(
  ({ laudo, especie, cliente, templateId = 'tecnico' }, ref) => {
    const { resultado } = laudo

    const dataFormatada = new Date(laudo.dataLaudo).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    // Configurações de Tema baseadas no templateId
    const themes = {
      tecnico:      { primary: '#0f172a', secondary: '#475569', bg: '#f8fafc', accent: '#334155', title: 'LAUDO TÉCNICO DE RISCO (ISA TRAQ)' },
      simplificado: { primary: '#166534', secondary: '#64748b', bg: '#f0fdf4', accent: '#16a34a', title: 'RELATÓRIO DE SEGURANÇA E MANUTENÇÃO' }
    }
    const theme = themes[templateId] || themes.tecnico

    const riscoColor: Record<string, string> = {
      Baixo:    '#16a34a',
      Moderado: '#d97706',
      Alto:     '#dc2626',
      Extremo:  '#991b1b',
    }

    const cor = riscoColor[resultado.classificacaoGeral] ?? theme.accent

    const getDynamicNarrative = () => {
      // Prioridade: Resumo gerado por IA
      if (laudo.aiResumo?.resumo_estado_geral) {
        return {
          title: 'Resumo Inteligente Arbolia',
          text: laudo.aiResumo.resumo_estado_geral,
          badge: 'IA ASSISTED',
          bg: theme.bg,
          border: cor,
          icon: <ShieldCheck size={20} style={{ color: cor }} />
        };
      }

      const risk = resultado.classificacaoGeral;
      const defs = laudo.defeitos;
      
      if (risk === 'Extremo' || risk === 'Alto') {
        return {
          title: 'Atenção Crítica Necessária',
          text: `Identificamos condições severas ${defs.length > 0 ? `(${defs.slice(0, 3).join(', ').toLowerCase()})` : ''} que representam risco imediato. A execução das mitigações recomendadas é prioritária para garantir a segurança no local e evitar danos severos.`,
          badge: 'URGENTE',
          bg: '#fef2f2',
          border: '#fee2e2',
          icon: <ShieldAlert size={20} style={{ color: '#dc2626' }} />
        };
      }
      if (risk === 'Moderado') {
        return {
          title: 'Manutenção Preventiva Recomendada',
          text: `A árvore apresenta sinais de atenção ${defs.length > 0 ? `(${defs.slice(0, 2).join(', ').toLowerCase()})` : ''} que requerem acompanhamento. A aplicação das recomendações abaixo irá reduzir a probabilidade de falhas futuras e aumentar a segurança.`,
          badge: 'PREVENTIVO',
          bg: '#fffbeb',
          border: '#fef3c7',
          icon: <ShieldQuestion size={20} style={{ color: '#d97706' }} />
        };
      }
      return {
        title: 'Monitoramento de Rotina',
        text: `O exemplar avaliado apresenta vigor e estabilidade satisfatórios. Não foram detectados defeitos críticos que exijam intervenção imediata. Recomendamos manter o plano de monitoramento anual para preservação da saúde fitossanitária.`,
        badge: 'ESTÁVEL',
        bg: '#f0fdf4',
        border: '#dcfce7',
        icon: <ShieldCheck size={20} style={{ color: '#16a34a' }} />
      };
    };

    const narrativeData = getDynamicNarrative();

    return (
      <div
        ref={ref}
        id="laudo-pdf-root"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 0,
          width: '794px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          fontSize: '12px',
          color: '#334155',
          background: '#ffffff',
          padding: '50px',
          lineHeight: '1.6',
        }}
      >
        {/* ── HEADER MODERNO ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1.5px solid #f1f5f9`, paddingBottom: '30px', marginBottom: '35px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoArbolia} alt="Arbolia Logo" style={{ height: '65px', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'left', minWidth: '180px' }}>
              <div style={{ fontSize: '7px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Responsável Técnico</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>{laudo.tecnicoNome}</div>
              <div style={{ fontSize: '8px', color: theme.primary, fontWeight: 600 }}>{laudo.tecnicoCrea}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{theme.title}</div>
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{dataFormatada} • Ref: {laudo.dataLaudo.split('T')[0].replace(/-/g, '')}</div>
            </div>
          </div>
        </div>

        {/* ── RESUMO EXECUTIVO / NARRATIVA ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '25px', marginBottom: '40px' }}>
          {/* Badge de Risco (Sempre visível) */}
          <div style={{ flex: '0 0 240px', background: theme.bg, border: `1.5px solid ${cor}`, borderRadius: '16px', padding: '25px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '15px', right: '15px', opacity: 0.1 }}>
              <TreeDeciduous size={60} color={cor} />
            </div>
            <div style={{ fontSize: '9px', fontWeight: 800, color: theme.secondary, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Nível de Risco Geral</div>
            <div style={{ fontSize: '42px', fontWeight: 950, color: cor, lineHeight: 1, letterSpacing: '-0.03em' }}>{resultado.classificacaoGeral.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '15px', fontWeight: 700, lineHeight: 1.4 }}>{resultado.metadataGeral.descricao}</div>
          </div>

          {/* Conteúdo Dinâmico (Muda conforme o template) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {templateId === 'simplificado' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>

                  {narrativeData.icon}
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{narrativeData.title}</span>
                  <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', background: narrativeData.bg, color: cor, border: `1px solid ${narrativeData.border}`, marginLeft: 'auto' }}>{narrativeData.badge}</span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', margin: 0, textAlign: 'justify' }}>
                  {narrativeData.text}
                </p>
              </>
            ) : (
              <div style={{ padding: '0 10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Resumo Técnico do Especialista</div>
                <p style={{ fontSize: '11px', color: '#334155', margin: 0, lineHeight: 1.6 }}>
                  Esta análise técnica foi conduzida utilizando a metodologia **ISA TRAQ (Tree Risk Assessment Qualification)**. O exemplar foi avaliado em relação a {laudo.entradasRisco.length} alvos específicos, considerando probabilidade de falha, impacto e as consequências associadas. {laudo.avaliacaoAvancada ? 'Uma inspeção avançada foi recomendada para aprofundamento do diagnóstico.' : ''}

                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── GRID DE INFORMAÇÕES TÉCNICAS ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
          <InfoCard icon={<TreeDeciduous size={14}/>} label="Espécie" value={especie} />
          <InfoCard icon={<User size={14}/>} label="Cliente" value={cliente} />
          <InfoCard icon={<MapPin size={14}/>} label="Técnico" value={laudo.tecnicoNome} />
          <InfoCard icon={<Info size={14}/>} label="Parecer" value={laudo.parecer === 'final' ? 'Final' : 'Preliminar'} />
        </div>

        {/* ── DETALHAMENTO DE ALVOS ────────────────────────────────────────── */}
        <Section title={templateId === 'tecnico' ? "Análise Técnica de Alvos e Matrizes" : "Áreas e Objetos Protegidos"} theme={theme}>
          <div style={{ border: '1.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1.5px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 800 }}>ALVO</th>
                  {templateId === 'tecnico' && (
                    <>
                      <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 800 }}>PARTE</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 800 }}>FALHA</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 800 }}>IMPACTO</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 800 }}>CONSEQ.</th>
                    </>
                  )}
                  {templateId === 'simplificado' && <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 800 }}>LOCALIZAÇÃO</th>}
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 800 }}>RISCO</th>
                </tr>
              </thead>
              <tbody>
                {laudo.entradasRisco.map((alvo, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 700, color: '#1e293b' }}>{alvo.alvo || 'Área de entorno'}</td>
                    {templateId === 'tecnico' && (
                      <>
                        <td style={{ padding: '12px 15px', textAlign: 'center', color: '#64748b' }}>{LABELS_PARTE_ARVORE[alvo.parte]}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center', color: '#64748b', textTransform: 'capitalize' }}>{alvo.probFalha}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center', color: '#64748b', textTransform: 'capitalize' }}>{alvo.probImpacto}</td>

                        <td style={{ padding: '12px 15px', textAlign: 'center', color: '#64748b', textTransform: 'capitalize' }}>{alvo.consequencia}</td>
                      </>
                    )}
                    {templateId === 'simplificado' && <td style={{ padding: '12px 15px', color: '#64748b' }}>{LABELS_PARTE_ARVORE[alvo.parte]}</td>}
                    <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 900, color: riscoColor[resultado.riscos[i].classificacao] }}>
                      {resultado.riscos[i].classificacao.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── RECOMENDAÇÕES (UX MODERNA) ────────────────────────────────────── */}
        <Section title="Plano de Ação e Mitigação" theme={theme}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {laudo.mitigacoesSelecionadas.length > 0 ? (
              resultado.riscos[0].riscoResidualPorMitigacao
                .filter(m => laudo.mitigacoesSelecionadas.includes(m.mitigacao.id))
                .map((m, i) => (
                  <div key={i} style={{ background: '#ffffff', border: `1.5px solid #f1f5f9`, borderRadius: '12px', padding: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.primary }} />
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>{m.mitigacao.label}</div>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.5 }}>
                      Objetivo: Reduzir a probabilidade de falha e o risco residual para <span style={{ fontWeight: 900, color: riscoColor[m.classificacao] }}>{m.classificacao}</span>.
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ gridColumn: 'span 2', padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b', border: '1.5px dashed #e2e8f0' }}>
                Nenhuma intervenção crítica imediata necessária. Recomendamos apenas o monitoramento fitossanitário anual.
              </div>
            )}
          </div>
          {laudo.aiResumo?.explicacao_mitigacao && (
            <div style={{ gridColumn: 'span 2', marginTop: '10px', padding: '15px', background: theme.bg, borderRadius: '12px', border: `1px solid ${cor}33` }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Interpretação das Recomendações (IA)</div>
              <p style={{ fontSize: '10.5px', color: '#475569', margin: 0, lineHeight: 1.5, textAlign: 'justify' }}>
                {laudo.aiResumo.explicacao_mitigacao}
              </p>
            </div>
          )}
        </Section>

        {/* ── OBSERVAÇÕES ──────────────────────────────────────────────────── */}
        {laudo.observacoes && (
          <div style={{ marginTop: '30px', padding: '15px 20px', borderLeft: `4px solid #e2e8f0`, background: '#f8fafc', borderRadius: '0 8px 8px 0' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>Observações do Especialista</div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>{laudo.observacoes}</div>
          </div>
        )}

        {/* ── RODAPÉ PREMIUM ───────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: '50px', left: '50px', right: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1.5px solid #f1f5f9', paddingTop: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#0f172a' }}>Arbolia® Arboricultura</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Inteligência em Gestão de Risco Arbóreo</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Padrão Internacional ISA TRAQ</div>
            <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '2px' }}>Documento Autenticado Eletronicamente</div>
          </div>
        </div>
      </div>
    )
  }
)

LaudoPDFTemplate.displayName = 'LaudoPDFTemplate'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '35px', display: 'block', width: '100%' }}>
      <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {title}
        <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />

      </div>
      <div style={{ display: 'block', width: '100%' }}>
        {children}
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '12px', padding: '12px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: '#94a3b8' }}>{icon}</span>
        <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</div>
    </div>
  )
}
