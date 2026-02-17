import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/ai/provider-router';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts';
import { calculateSeoScore } from '@/lib/seo/calculate-score';
import type { GenerateRequest } from '@/types/content';
import { AI_MODELS } from '@/types/ai';

const RATE_LIMIT = {
  guest: 3,   // 비로그인: 3회/일
  user: 20,   // 로그인: 20회/일
};

async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const limit = user ? RATE_LIMIT.user : RATE_LIMIT.guest;
  let used = 0;

  if (user) {
    const { count } = await supabase
      .from('generation_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());
    used = count ?? 0;
  } else {
    const { count } = await supabase
      .from('generation_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .is('user_id', null)
      .gte('created_at', since.toISOString());
    used = count ?? 0;
  }

  if (used >= limit) {
    return { allowed: false, remaining: 0, used, limit };
  }

  await supabase.from('generation_usage').insert({
    user_id: user?.id ?? null,
    ip_address: ip,
  });

  return { allowed: true, remaining: limit - used - 1, used: used + 1, limit };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { keyword, options } = body;

    if (!keyword || keyword.trim().length === 0) {
      return Response.json(
        { error: { code: 'KEYWORD_EMPTY', message: '키워드를 입력해주세요' } },
        { status: 400 }
      );
    }

    if (keyword.length > 50) {
      return Response.json(
        { error: { code: 'KEYWORD_TOO_LONG', message: '키워드는 50자 이내로 입력해주세요' } },
        { status: 400 }
      );
    }

    // Rate Limiting
    const rateLimit = await checkRateLimit(request);
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: '일일 생성 횟수를 초과했습니다. 로그인하면 더 많이 사용할 수 있습니다.',
            details: { used: rateLimit.used, limit: rateLimit.limit, remaining: 0 },
          },
        },
        { status: 429 }
      );
    }

    // AI 모델 유효성 검사
    const modelConfig = AI_MODELS.find(
      m => m.provider === options.ai_provider && m.model === options.ai_model
    );
    if (!modelConfig) {
      return Response.json(
        { error: { code: 'INVALID_MODEL', message: '지원하지 않는 AI 모델입니다' } },
        { status: 400 }
      );
    }

    const provider = getProvider(options.ai_provider);
    const systemPrompt = buildSystemPrompt(options);
    const userPrompt = buildUserPrompt(keyword, options.include_keywords);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          let titleSent = false;

          const aiStream = provider.generateStream({
            systemPrompt,
            userPrompt,
            model: options.ai_model,
            maxTokens: modelConfig.maxTokens,
          });

          for await (const chunk of aiStream) {
            fullContent += chunk;

            if (!titleSent && fullContent.includes('\n')) {
              const firstLine = fullContent.split('\n')[0].trim();
              if (firstLine.length > 0) {
                // 마크다운 # 제거 또는 순수 텍스트 첫 줄을 제목으로
                const title = firstLine.replace(/^#+\s*/, '');
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'title', content: title })}\n\n`)
                );
                titleSent = true;
              }
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content_chunk', content: chunk })}\n\n`)
            );
          }

          const titleMatch = fullContent.match(/^#+\s*(.+)/);
          const title = titleMatch ? titleMatch[1] : (fullContent.split('\n')[0]?.trim() || '');
          const seoScore = calculateSeoScore({
            keyword,
            title,
            content: fullContent,
            contentLength: options.length,
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'seo_score', content: JSON.stringify(seoScore) })}\n\n`)
          );

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', remaining: rateLimit.remaining, used: rateLimit.used, limit: rateLimit.limit })}\n\n`)
          );

          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'AI 콘텐츠 생성에 실패했습니다';
          const isQuotaError = message.includes('quota')
            || message.includes('rate limit')
            || message.includes('billing')
            || message.includes('insufficient')
            || message.includes('exceeded')
            || message.includes('429')
            || message.includes('credit');
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              content: isQuotaError
                ? `AI_QUOTA_EXCEEDED:${options.ai_provider}`
                : message,
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return Response.json(
      { error: { code: 'GENERATION_FAILED', message: '콘텐츠 생성에 실패했습니다' } },
      { status: 500 }
    );
  }
}
