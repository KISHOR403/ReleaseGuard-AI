import { LLMProvider, LLMRequest, LLMResponse } from './providers/llm-provider.interface';
import { LLMProviderFactory } from './providers/provider.factory';

export interface LLMClientOptions {
  provider?: LLMProvider;
  maxRetries?: number;
  timeoutMs?: number;
}

export class LLMClient {
  private readonly provider: LLMProvider;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options?: LLMClientOptions) {
    this.provider = options?.provider || LLMProviderFactory.create();
    this.maxRetries = options?.maxRetries ?? 2;
    this.timeoutMs = options?.timeoutMs ?? 30000;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async executeStructuredPrompt<T>(
    request: LLMRequest,
    validator: (data: unknown) => { success: true; data: T } | { success: false; error: string }
  ): Promise<{ data: T; response: LLMResponse }> {
    let currentRequest: LLMRequest = { ...request };
    let lastError = '';

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const responsePromise = this.provider.analyze(currentRequest);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`LLM request timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        );

        const response = await Promise.race([responsePromise, timeoutPromise]);

        // Clean potential markdown markdown fence wrapping (e.g. ```json ... ```)
        let jsonStr = response.content.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (jsonErr) {
          lastError = `Malformed JSON output: ${(jsonErr as Error).message}. Response snippet: ${jsonStr.slice(0, 150)}`;
          if (attempt < this.maxRetries) {
            currentRequest = {
              ...request,
              userPrompt: `${request.userPrompt}\n\n[CORRECTION REQUIRED]: Your previous response was not valid JSON: "${lastError}". Return ONLY valid JSON matching the requested schema.`,
            };
            continue;
          }
          throw new Error(lastError);
        }

        const validation = validator(parsed);
        if (validation.success) {
          return { data: validation.data, response };
        }

        lastError = `Schema validation failed: ${validation.error}`;
        if (attempt < this.maxRetries) {
          currentRequest = {
            ...request,
            userPrompt: `${request.userPrompt}\n\n[CORRECTION REQUIRED]: Your previous output failed schema validation: "${validation.error}". Adjust your output to strictly conform to the required JSON schema.`,
          };
          continue;
        }

        throw new Error(lastError);
      } catch (err) {
        if (attempt >= this.maxRetries) {
          const sanitizedMessage = (err as Error).message.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]');
          throw new Error(`LLM analysis failed after ${this.maxRetries + 1} attempts: ${sanitizedMessage}`);
        }
      }
    }

    throw new Error(`LLM analysis failed: ${lastError}`);
  }
}
