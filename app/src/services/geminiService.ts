const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-flash-latest';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
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

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      logger.warn('Gemini retornou uma resposta vazia.');
      return null;
    }

    // Limpeza de markdown caso a IA ignore a instrução de não usar markdown
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    logger.log('Interpretação IA recebida com sucesso.');
    return JSON.parse(textResponse) as GeminiResponse;
  } catch (error) {
    logger.error('Erro ao chamar API do Gemini:', error);
    return null;
  }
};
