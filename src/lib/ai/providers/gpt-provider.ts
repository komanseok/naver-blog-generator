import OpenAI from 'openai';
import type { AiProvider } from '@/types/ai';

export class GptProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async *generateStream(params: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    maxTokens: number;
  }): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
