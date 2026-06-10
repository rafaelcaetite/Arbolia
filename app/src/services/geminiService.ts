const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Definimos pares de modelo e versão da API para testar
interface ModelConfig {
  name: string;
  apiVersion: 'v1' | 'v1beta';
}

const CONFIGS_TO_TRY: ModelConfig[] = [
  { name: 'gemini-2.0-flash', apiVersion: 'v1' },     // 1ª Tentativa: 2.0 Estável
  { name: 'gemini-2.0-flash', apiVersion: 'v1beta' }, // 2ª Tentativa: 2.0 Beta
  { name: 'gemini-2.5-flash', apiVersion: 'v1beta' }, // 3ª Tentativa: 2.5 Beta (Alta compatibilidade)
  { name: 'gemini-3.5-flash', apiVersion: 'v1beta' }  // 4ª Tentativa: 3.5 Beta
];

const getApiUrl = (model: string, version: string) =>
  `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

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

1. Leia os dados JSON e formule um laudo técnico narrativo.
2. Não adicione saudações, nem notas de rodapé, apenas responda com o conteúdo solicitado.
3. Explique os jargões técnicos de forma breve (Ex: se o JSON citar 'Codominância' ou 'Dano no alburno', explique rapidamente o que isso significa para a estrutura da árvore).
4. Você deve retornar EXCLUSIVAMENTE um objeto JSON válido, sem formatação markdown (\`\`\`json), contendo exatamente duas chaves:
   - "resumo_estado_geral": Um parágrafo de 4 a 5 linhas resumindo a saúde da árvore, os principais defeitos estruturais encontrados e justificando, de forma simples, por que a árvore atingiu a classificação de risco informada.
   - "explicacao_mitigacao": Um parágrafo de 3 a 4 linhas explicando quais foram as opções de mitigação recomendadas pelo técnico e como a execução dessas ações diminuirá o risco (risco residual).`;

  const prompt = `Analise os seguintes dados de inspeção e gere o relatório em JSON:
  ${JSON.stringify(payload, null, 2)}`;

  for (const config of CONFIGS_TO_TRY) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      logger.log(`Tentando requisição com o modelo: ${config.name} via endpoint: ${config.apiVersion}`);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos por tentativa

      const apiUrl = getApiUrl(config.name, config.apiVersion);
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
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('O modelo retornou uma resposta sem conteúdo de texto.');
      }

      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedResponse = JSON.parse(textResponse) as GeminiResponse;

      logger.log(`Interpretação obtida com sucesso via ${config.name} (${config.apiVersion}).`);
      return parsedResponse;

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      logger.warn(
        `Falha na tentativa com ${config.name} (${config.apiVersion}). Erro: ${error instanceof Error ? error.message : error
        }`
      );
    }
  }

  logger.error('Nenhum modelo ou versão da API obteve resposta com sucesso.');
  return null;
};