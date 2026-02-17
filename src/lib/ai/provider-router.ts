import type { AiProvider, AiProviderType } from '@/types/ai';
import { ClaudeProvider } from './providers/claude-provider';
import { GptProvider } from './providers/gpt-provider';
import { GeminiProvider } from './providers/gemini-provider';
import { MockProvider } from './providers/mock-provider';

const providerInstances: Partial<Record<AiProviderType, AiProvider>> = {};

export function getProvider(providerName: AiProviderType): AiProvider {
  if (!providerInstances[providerName]) {
    switch (providerName) {
      case 'mock':
        providerInstances[providerName] = new MockProvider();
        break;
      case 'claude':
        providerInstances[providerName] = new ClaudeProvider();
        break;
      case 'gpt':
        providerInstances[providerName] = new GptProvider();
        break;
      case 'gemini':
        providerInstances[providerName] = new GeminiProvider();
        break;
      default:
        throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }
  return providerInstances[providerName]!;
}
