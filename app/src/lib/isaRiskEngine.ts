/**
 * ISA Risk Engine — Metodologia TRAQ (Tree Risk Assessment Qualification)
 *
 * Implementa o cruzamento de matrizes CATEGÓRICAS conforme o padrão internacional ISA
 * adaptado ao formulário BR-2 (Transcortt Soluções Ambientais).
 *
 * As matrizes refletem exatamente as tabelas do formulário.
 * O motor suporta múltiplos alvos × partes da árvore, calculando o risco geral
 * como o maior risco individual encontrado.
 */


// ─── Tipos de Entrada ────────────────────────────────────────────────────────

// Probabilidade de Falha — 4 níveis conforme formulário
export type ProbabilidadeFalha =
  | 'iminente'
  | 'provavel'
  | 'possivel'
  | 'impossivel'   // ← formulário usa "Impossível", não "Improvável"

// Probabilidade de Impacto — 4 níveis conforme formulário
export type ProbabilidadeImpacto =
  | 'alto'
  | 'medio'
  | 'baixo'
  | 'muito_baixo'

// Saída da Matriz 1 (Falha × Impacto) — 4 níveis conforme formulário
// "Insignificante" e "Mínimo" são níveis ISA distintos de "Improvável"
export type FalhaeImpacto =
  | 'muito_provavel'   // Mt. Provável
  | 'provavel'         // Provável
  | 'minimo'           // Mínimo  ← substituí "pouco_provavel"
  | 'insignificante'   // Insignificante ← substituí "improvavel"

// Consequência — 4 níveis conforme formulário
export type Consequencia =
  | 'severa'
  | 'significante'     // ← formulário usa "Significante", não "Significativa"
  | 'minima'           // ← formulário usa "Mínima", não "Menor"
  | 'insignificante'

// Classificação Final de Risco
export type ClassificacaoRisco = 'Extremo' | 'Alto' | 'Moderado' | 'Baixo'

// Parte da árvore avaliada
export type ParteArvore = 'copa' | 'galhos' | 'tronco' | 'raiz_base'

export type Limitante = 'nenhum' | 'visibilidade' | 'acesso' | 'ervas_daninhas' | 'colar_enterrado'


// ─── Labels para exibição na UI ───────────────────────────────────────────────

export const LABELS_PROB_FALHA: Record<ProbabilidadeFalha, string> = {
  iminente: 'Iminente',
  provavel: 'Provável',
  possivel: 'Possível',
  impossivel: 'Impossível',
}

export const LABELS_PROB_IMPACTO: Record<ProbabilidadeImpacto, string> = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
  muito_baixo: 'Muito Baixo',
}

export const LABELS_FI: Record<FalhaeImpacto, string> = {
  muito_provavel: 'Mt. Provável',
  provavel: 'Provável',
  minimo: 'Mínimo',
  insignificante: 'Insignificante',
}

export const LABELS_CONSEQUENCIA: Record<Consequencia, string> = {
  severa: 'Severa',
  significante: 'Significante',
  minima: 'Mínima',
  insignificante: 'Insignificante',
}

export const LABELS_PARTE_ARVORE: Record<ParteArvore, string> = {
  copa: 'Copa',
  galhos: 'Galhos',
  tronco: 'Tronco',
  raiz_base: 'Raiz e Base do Tronco',
}

export const LABELS_LIMITANTE: Record<Limitante, string> = {
  nenhum: 'Não houve',
  visibilidade: 'Visibilidade',
  acesso: 'Acesso',
  ervas_daninhas: 'Ervas daninhas',
  colar_enterrado: 'Colar da raiz enterrado',
}


// ─── Opções de Mitigação ──────────────────────────────────────────────────────

export interface OpcaoMitigacao {
  id: string
  label: string
  /** Reduz PF em N níveis (ex: 1 = iminente→provável) */
  reducaoPF: number
  /** Reduz PI em N níveis */
  reducaoPI: number
}

export const OPCOES_MITIGACAO: OpcaoMitigacao[] = [
  { id: 'poda_seguranca', label: 'Poda de segurança', reducaoPF: 1, reducaoPI: 0 },
  { id: 'coroamento_base', label: 'Coroamento da base / solos', reducaoPF: 1, reducaoPI: 1 },
  { id: 'endoterapia', label: 'Endoterapia / tratamento', reducaoPF: 2, reducaoPI: 0 },
  { id: 'cabo_suporte', label: 'Instalação de cabo de suporte', reducaoPF: 1, reducaoPI: 0 },
  { id: 'remocao_alvo', label: 'Remoção / relocação do alvo', reducaoPF: 0, reducaoPI: 2 },
]


// ─── MATRIZ 1: PF × PI → FalhaeImpacto ───────────────────────────────────────
//
// Fonte: Tabela "Matriz de Probabilidade" do formulário BR-2
//
//                | Alto          | Médio         | Baixo         | Muito Baixo
// Iminente       | Mt. Provável  | Provável       | Mínimo        | Insignificante
// Provável       | Provável      | Mínimo         | Insignificante| Insignificante
// Possível       | Mínimo        | Insignificante | Insignificante| Insignificante
// Impossível     | Insignificante| Insignificante | Insignificante| Insignificante

type MatrizPFPI = Record<ProbabilidadeFalha, Record<ProbabilidadeImpacto, FalhaeImpacto>>

const MATRIZ_PF_PI: MatrizPFPI = {
  iminente: {
    alto: 'muito_provavel',
    medio: 'provavel',
    baixo: 'minimo',
    muito_baixo: 'insignificante',
  },
  provavel: {
    alto: 'provavel',
    medio: 'minimo',
    baixo: 'insignificante',
    muito_baixo: 'insignificante',
  },
  possivel: {
    alto: 'minimo',
    medio: 'insignificante',
    baixo: 'insignificante',
    muito_baixo: 'insignificante',
  },
  impossivel: {
    alto: 'insignificante',
    medio: 'insignificante',
    baixo: 'insignificante',
    muito_baixo: 'insignificante',
  },
}


// ─── MATRIZ 2: FalhaeImpacto × Consequência → Risco Final ────────────────────
//
// Fonte: Tabela "Matriz de Avaliação de Risco" do formulário BR-2
//
//                  | Insignificante | Mínima   | Significante | Severa
// Mt. Provável     | Baixo          | Moderado | Alto         | Extremo
// Provável         | Baixo          | Moderado | Alto         | Alto
// Mínimo           | Baixo          | Baixo    | Moderado     | Moderado
// Insignificante   | Baixo          | Baixo    | Baixo        | Baixo

type MatrizFIxC = Record<FalhaeImpacto, Record<Consequencia, ClassificacaoRisco>>

const MATRIZ_FI_C: MatrizFIxC = {
  muito_provavel: {
    insignificante: 'Baixo',
    minima: 'Moderado',
    significante: 'Alto',
    severa: 'Extremo',
  },
  provavel: {
    insignificante: 'Baixo',
    minima: 'Moderado',
    significante: 'Alto',
    severa: 'Alto',
  },
  minimo: {
    insignificante: 'Baixo',
    minima: 'Baixo',
    significante: 'Moderado',
    severa: 'Moderado',
  },
  insignificante: {
    insignificante: 'Baixo',
    minima: 'Baixo',
    significante: 'Baixo',
    severa: 'Baixo',
  },
}


// ─── Metadados por classificação ──────────────────────────────────────────────

export interface RiscoMetadata {
  cor: string
  corBg: string
  corBorder: string
  frequenciaMeses: number
  frequenciaLabel: string
  descricao: string
}

const RISCO_METADATA: Record<ClassificacaoRisco, RiscoMetadata> = {
  Baixo: {
    cor: '#16a34a',
    corBg: '#f0fdf4',
    corBorder: '#bbf7d0',
    frequenciaMeses: 12,
    frequenciaLabel: '1× ao ano',
    descricao: 'Risco aceitável. Monitoramento anual recomendado.',
  },
  Moderado: {
    cor: '#d97706',
    corBg: '#fffbeb',
    corBorder: '#fde68a',
    frequenciaMeses: 6,
    frequenciaLabel: '2× ao ano',
    descricao: 'Risco requer atenção. Inspeção semestral e mitigação planejada.',
  },
  Alto: {
    cor: '#dc2626',
    corBg: '#fef2f2',
    corBorder: '#fecaca',
    frequenciaMeses: 4,
    frequenciaLabel: '3× ao ano',
    descricao: 'Risco significativo. Ação de mitigação prioritária necessária.',
  },
  Extremo: {
    cor: '#7f1d1d',
    corBg: '#450a0a',
    corBorder: '#991b1b',
    frequenciaMeses: 3,          // na prática: ação imediata
    frequenciaLabel: 'Ação imediata',
    descricao: 'Risco inaceitável. Requer intervenção imediata ou interdição da área.',
  },
}


// ─── Ordem dos níveis para redução por mitigação ─────────────────────────────

const PF_ORDER: ProbabilidadeFalha[] = ['iminente', 'provavel', 'possivel', 'impossivel']
const PI_ORDER: ProbabilidadeImpacto[] = ['alto', 'medio', 'baixo', 'muito_baixo']

function reducirPF(pf: ProbabilidadeFalha, niveis: number): ProbabilidadeFalha {
  const idx = PF_ORDER.indexOf(pf)
  return PF_ORDER[Math.min(idx + niveis, PF_ORDER.length - 1)]
}

function reducirPI(pi: ProbabilidadeImpacto, niveis: number): ProbabilidadeImpacto {
  const idx = PI_ORDER.indexOf(pi)
  return PI_ORDER[Math.min(idx + niveis, PI_ORDER.length - 1)]
}

// Ordem de severidade para comparação
const RISCO_ORDER: ClassificacaoRisco[] = ['Baixo', 'Moderado', 'Alto', 'Extremo']

function riscoMaior(a: ClassificacaoRisco, b: ClassificacaoRisco): ClassificacaoRisco {
  return RISCO_ORDER.indexOf(a) >= RISCO_ORDER.indexOf(b) ? a : b
}


// ─── Estruturas de entrada e saída ───────────────────────────────────────────

/** Um risco individual: combinação de Alvo + Parte da árvore */
export interface EntradaRisco {
  /** Identificador do alvo (ex: "1", "2", "Galpão") */
  alvo: string
  /** Parte da árvore avaliada */
  parte: ParteArvore
  /** Condições preocupantes observadas (texto livre) */
  condicoesPreocupantes?: string
  probFalha: ProbabilidadeFalha
  probImpacto: ProbabilidadeImpacto
  consequencia: Consequencia
}

export interface ResultadoRiscoIndividual {
  entrada: EntradaRisco
  falhaeImpacto: FalhaeImpacto
  classificacao: ClassificacaoRisco
  metadata: RiscoMetadata
  riscoResidualPorMitigacao: {
    mitigacao: OpcaoMitigacao
    pfMitigado: ProbabilidadeFalha
    piMitigado: ProbabilidadeImpacto
    fiMitigado: FalhaeImpacto
    classificacao: ClassificacaoRisco
    metadata: RiscoMetadata
  }[]
}

export interface ResultadoISA {
  /** Resultados individuais por Alvo × Parte da árvore */
  riscos: ResultadoRiscoIndividual[]
  /**
   * Classificação geral da árvore = maior risco entre todos os individuais.
   * Reflete o campo "Classificação geral de risco" do formulário.
   */
  classificacaoGeral: ClassificacaoRisco
  metadataGeral: RiscoMetadata
  /**
   * Menor risco residual possível após aplicar a melhor mitigação disponível
   * para o risco de maior classificação.
   * Reflete o campo "Clas. de risco residual" do formulário.
   */
  melhorRiscoResidual: ClassificacaoRisco
  metadataMelhorResidual: RiscoMetadata
}


// ─── Cálculo de um risco individual ──────────────────────────────────────────

export function calcularRiscoIndividual(entrada: EntradaRisco): ResultadoRiscoIndividual {
  const fi = MATRIZ_PF_PI[entrada.probFalha][entrada.probImpacto]
  const classificacao = MATRIZ_FI_C[fi][entrada.consequencia]

  const riscoResidualPorMitigacao = OPCOES_MITIGACAO.map(opcao => {
    const pfMitigado = reducirPF(entrada.probFalha, opcao.reducaoPF)
    const piMitigado = reducirPI(entrada.probImpacto, opcao.reducaoPI)
    const fiMitigado = MATRIZ_PF_PI[pfMitigado][piMitigado]
    const classResidual = MATRIZ_FI_C[fiMitigado][entrada.consequencia]
    return {
      mitigacao: opcao,
      pfMitigado,
      piMitigado,
      fiMitigado,
      classificacao: classResidual,
      metadata: RISCO_METADATA[classResidual],
    }
  })

  return {
    entrada,
    falhaeImpacto: fi,
    classificacao,
    metadata: RISCO_METADATA[classificacao],
    riscoResidualPorMitigacao,
  }
}


// ─── Função principal: múltiplos riscos → resultado da árvore ────────────────

/**
 * Recebe uma lista de EntradaRisco (cada linha da tabela "Categorização do Risco")
 * e retorna o resultado consolidado da árvore, incluindo classificação geral
 * e melhor risco residual.
 */
export function calcularRiscoISA(entradas: EntradaRisco[]): ResultadoISA {
  if (entradas.length === 0) {
    throw new Error('Ao menos uma entrada de risco é necessária.')
  }

  const riscos = entradas.map(calcularRiscoIndividual)

  // Classificação geral = maior risco individual
  const classificacaoGeral = riscos.reduce<ClassificacaoRisco>(
    (maior, r) => riscoMaior(maior, r.classificacao),
    'Baixo'
  )

  // Melhor risco residual = menor residual entre todas as opções de mitigação
  // do risco de maior classificação
  const riscoCritico = riscos.find(r => r.classificacao === classificacaoGeral)!
  const melhorRiscoResidual = riscoCritico.riscoResidualPorMitigacao.reduce(
    (menor, m) =>
      RISCO_ORDER.indexOf(m.classificacao) < RISCO_ORDER.indexOf(menor)
        ? m.classificacao
        : menor,
    classificacaoGeral
  )

  return {
    riscos,
    classificacaoGeral,
    metadataGeral: RISCO_METADATA[classificacaoGeral],
    melhorRiscoResidual,
    metadataMelhorResidual: RISCO_METADATA[melhorRiscoResidual],
  }
}


// ─── Retrocompatibilidade: assinatura anterior (risco único) ─────────────────

/**
 * @deprecated Use `calcularRiscoISA([{ alvo, parte, probFalha, probImpacto, consequencia }])`
 * Mantido para não quebrar chamadas legadas de um único risco.
 */
export function calcularRiscoISALegado(
  probFalha: ProbabilidadeFalha,
  probImpacto: ProbabilidadeImpacto,
  consequencia: Consequencia,
): ResultadoRiscoIndividual {
  return calcularRiscoIndividual({
    alvo: 'único',
    parte: 'tronco',
    probFalha,
    probImpacto,
    consequencia,
  })
}