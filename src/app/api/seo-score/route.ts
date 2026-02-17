import { NextRequest } from 'next/server';
import { calculateSeoScore } from '@/lib/seo/calculate-score';
import type { ContentLength } from '@/types/seo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, title, content, contentLength = 'medium' } = body as {
      keyword: string;
      title: string;
      content: string;
      contentLength?: ContentLength;
    };

    if (!keyword || !content) {
      return Response.json(
        { error: { code: 'INVALID_INPUT', message: '키워드와 본문은 필수입니다' } },
        { status: 400 }
      );
    }

    const score = calculateSeoScore({ keyword, title, content, contentLength });
    return Response.json(score);
  } catch {
    return Response.json(
      { error: { code: 'SCORE_CALC_FAILED', message: 'SEO 점수 계산에 실패했습니다' } },
      { status: 500 }
    );
  }
}
