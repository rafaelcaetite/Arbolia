const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Lista de modelos ordenados por preferência (Tentativa 1 -> Tentativa 2)
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

// Função auxiliar para construir a URL com o modelo específico
const getApiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiResponse {
  resumo_estado_geral: string;
  explicacao_mitigacao: string;
}

import { AppLogger } from '../lib/logger';

export interface GeminiRequestPayload {
  especie: string;
  defeitos: string[];
  risco_geral: string;
  mitigacoes_sugeridas: string[];
  observacoes_tecnicas: string;
}

export const getAIInterpretation = async (payload: GeminiRequestPayload): Promise<GeminiResponse | null> => {
  const logger = AppLogger.getInstance();

  if (!GEMINI_API_KEY) {
    logger.warn('VITE_GEMINI_API_KEY não configurada. IA indisponível.');
    return null;
  }

  const systemInstruction = `Você é um arborista especialista responsável por traduzir avaliações técnicas de risco de árvores (Metodologia ISA) para clientes finais leigos (como síndicos e gestores).

Você receberá um JSON contendo os dados brutos de uma inspeção de campo (espécie da árvore, defeitos encontrados, classificação de risco calculada e mitigações sugeridas).

SUAS REGRAS ESTRITAS:
1. Seja empático, claro e profissional.
2. NÃO invente, adicione ou presuma nenhum dado, defeito, risco ou mitigação que não esteja explicitamente presente no JSON de entrada fornecido.
3. Explique os jargões técnicos de forma breve (Ex: se o JSON citar 'Codominância' ou 'Dano no alburno', explique rapidamente o que isso significa para a estrutura da árvore).
4. Você deve retornar EXCLUSIVAMENTE um objeto JSON válido, sem formatação markdown (\`\`\`json), contendo exatamente duas chaves:
   - "resumo_estado_geral": Um parágrafo de 4 a 5 linhas resumindo a saúde da árvore, os principais defeitos estruturais encontrados e justificando, de forma simples, por que a árvore atingiu a classificação de risco informada.
   - "explicacao_mitigacao": Um parágrafo de 3 a 4 linhas explicando quais foram as opções de mitigação recomendadas pelo técnico e como a execução dessas ações diminuirá o risco (risco residual).`;

  const prompt = `Analise os seguintes dados de inspeção e gere o relatório em JSON:
  ${JSON.stringify(payload, null, 2)}`;

  // Percorre a lista de modelos sequencialmente
  for (const model of GEMINI_MODELS) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      logger.log(`Tentando obter interpretação da IA com o modelo: ${model}`);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);

      const apiUrl = getApiUrl(model);
      const response = await fetch(apiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemInstruction + "\n\n" + prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status de erro HTTP: ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('O modelo retornou uma resposta vazia.');
      }

      // Limpeza de markdown caso o modelo adicione formatação
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedResponse = JSON.parse(textResponse) as GeminiResponse;

      logger.log(`Interpretação IA recebida com sucesso utilizando o modelo: ${model}`);
      return parsedResponse;

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      logger.warn(
        `Falha ao tentar utilizar o modelo ${model}. Detalhes: ${error instanceof Error ? error.message : error
        }`
      );
      // O loop continuará para o próximo modelo da lista
    }
  }

  // Se o fluxo chegar aqui, significa que todos os modelos falharam
  logger.error('Todos os modelos de IA configurados falharam na tentativa de obter a interpretação.');
  return null;
};