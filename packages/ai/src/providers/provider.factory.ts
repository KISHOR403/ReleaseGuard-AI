import { LLMProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { MockLLMProvider } from './mock.provider';

export class LLMProviderFactory {
  static create(providerName?: string): LLMProvider {
    const provider = providerName || process.env.AI_PROVIDER || 'gemini';

    switch (provider.toLowerCase()) {
      case 'mock':
        return new MockLLMProvider();
      case 'gemini':
        return new GeminiProvider();
      default:
        throw new Error(
          `Unsupported AI Provider: "${provider}". Supported providers: "gemini", "mock".`
        );
    }
  }
}
