export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LLMRequest {
  systemPrompt?: string;
  userPrompt: string;
  responseSchema?: Record<string, unknown>;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: TokenUsage;
  model: string;
  provider: string;
}

export interface LLMProvider {
  readonly name: string;
  analyze(request: LLMRequest): Promise<LLMResponse>;
}
