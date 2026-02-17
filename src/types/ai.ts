export type AiProviderType = 'claude' | 'gpt' | 'gemini' | 'mock';

export interface AiModelConfig {
  provider: AiProviderType;
  model: string;
  label: string;
  description: string;
  maxTokens: number;
}

export const AI_MODELS: AiModelConfig[] = [
  {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: '무료 티어, 빠른 속도',
    maxTokens: 8192,
  },
  {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    label: 'Claude Sonnet 4.5',
    description: '프리미엄 · 한국어 품질 우수',
    maxTokens: 8192,
  },
  {
    provider: 'gpt',
    model: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    description: '프리미엄 · 범용 고성능',
    maxTokens: 4096,
  },
  {
    provider: 'mock',
    model: 'mock-v1',
    label: 'Mock (테스트)',
    description: 'API 키 없이 테스트용',
    maxTokens: 4096,
  },
];

export interface AiProvider {
  generateStream(params: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    maxTokens: number;
  }): AsyncIterable<string>;
}
