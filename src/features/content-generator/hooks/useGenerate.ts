'use client';

import { useCallback } from 'react';
import { useGenerateStore } from '@/stores/useGenerateStore';
import type { SeoScore } from '@/types/seo';

interface UsageResult {
  used: number;
  limit: number;
  remaining: number;
}

export function useGenerate() {
  const {
    keyword, options, isGenerating,
    setIsGenerating, setTitle, appendContent, setSeoScore, setUsage, reset,
  } = useGenerateStore();

  const generate = useCallback(async (): Promise<UsageResult | undefined> => {
    if (!keyword.trim() || isGenerating) return;

    reset();
    setIsGenerating(true);

    let usageResult: UsageResult | undefined;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, options }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '생성에 실패했습니다');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('스트림을 읽을 수 없습니다');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            switch (event.type) {
              case 'title':
                setTitle(event.content);
                break;
              case 'content_chunk':
                appendContent(event.content);
                break;
              case 'seo_score':
                setSeoScore(
                  typeof event.content === 'string'
                    ? JSON.parse(event.content) as SeoScore
                    : event.content as SeoScore
                );
                break;
              case 'done':
                usageResult = { used: event.used, limit: event.limit, remaining: event.remaining };
                setUsage(usageResult);
                break;
              case 'error':
                throw new Error(event.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      return usageResult;
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [keyword, options, isGenerating, reset, setIsGenerating, setTitle, appendContent, setSeoScore, setUsage]);

  return { generate };
}
