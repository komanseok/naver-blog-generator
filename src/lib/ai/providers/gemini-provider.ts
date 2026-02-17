import { GoogleGenAI } from '@google/genai';
import type { AiProvider } from '@/types/ai';

export class GeminiProvider implements AiProvider {
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
  }

  async *generateStream(params: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    maxTokens: number;
  }): AsyncIterable<string> {
    const response = await this.client.models.generateContentStream({
      model: params.model,
      config: {
        maxOutputTokens: params.maxTokens,
        systemInstruction: params.systemPrompt,
      },
      contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }
}
