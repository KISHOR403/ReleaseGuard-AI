import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMRequest, LLMResponse } from './llm-provider.interface';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName = 'gemini-2.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.modelName = process.env.GEMINI_MODEL || modelName;
  }

  async analyze(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error(
        'GeminiProvider configuration error: GEMINI_API_KEY is not set. ' +
          'Please set GEMINI_API_KEY in your environment variables or .env file.'
      );
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const config: {
      systemInstruction?: string;
      responseMimeType?: string;
      responseSchema?: Record<string, unknown>;
      temperature?: number;
    } = {};

    if (request.systemPrompt) {
      config.systemInstruction = request.systemPrompt;
    }

    if (request.responseSchema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = request.responseSchema;
    }

    if (request.temperature !== undefined) {
      config.temperature = request.temperature;
    }

    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: request.userPrompt,
      config,
    });

    const text = response.text || '';

    // Extract token usage if available
    let tokensUsed = undefined;
    if (response.usageMetadata) {
      tokensUsed = {
        inputTokens: response.usageMetadata.promptTokenCount || 0,
        outputTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0,
      };
    }

    return {
      content: text,
      tokensUsed,
      model: this.modelName,
      provider: this.name,
    };
  }
}
