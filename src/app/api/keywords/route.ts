import { NextRequest } from 'next/server';
import type { KeywordSuggestion } from '@/types/keyword';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return Response.json({ suggestions: [] });
  }

  try {
    // 네이버 자동완성 API
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://ac.search.naver.com/nx/ac?q=${encodedQuery}&con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8`,
      { next: { revalidate: 300 } } // 5분 캐시
    );

    if (!response.ok) {
      return Response.json({ suggestions: [] });
    }

    const data = await response.json();
    const suggestions: KeywordSuggestion[] = [];

    // 자동완성 결과 파싱
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (Array.isArray(item)) {
          for (const pair of item) {
            if (Array.isArray(pair) && pair[0]) {
              suggestions.push({
                keyword: pair[0],
                source: 'autocomplete',
              });
            }
          }
        }
      }
    }

    return Response.json({ suggestions: suggestions.slice(0, 10) });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
