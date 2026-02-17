'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getHistoryItem, type HistoryItem } from '@/lib/history/storage';
import { toast } from 'sonner';

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function markdownToHtml(text: string): string {
  const h2Style = 'font-size:22px; font-weight:700; margin:28px 0 12px; color:#111;';
  const h3Style = 'font-size:18px; font-weight:700; margin:20px 0 8px; color:#111;';
  const pStyle = 'font-size:15px; line-height:1.8; margin:0 0 8px; color:#374151;';

  // 이미 HTML 태그가 포함되어 있으면 (에디터 편집본) 인라인 스타일 주입
  if (/<[a-z][\s\S]*>/i.test(text) && !text.startsWith('#')) {
    return text
      .replace(/<h2(?=[\s>])/g, `<h2 style="${h2Style}"`)
      .replace(/<h3(?=[\s>])/g, `<h3 style="${h3Style}"`)
      .replace(/<p(?=[\s>])/g, `<p style="${pStyle}"`)
      .replace(/<b>/g, '<b style="font-weight:700;">')
      .replace(/<strong>/g, '<strong style="font-weight:700;">');
  }

  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('### '))
        return `<h3 style="${h3Style}">${line.slice(4)}</h3>`;
      if (line.startsWith('## '))
        return `<h2 style="${h2Style}">${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return '';
      // 이모지 소제목 (홈판형)
      if (emojiRegex.test(line.trim()) && line.trim().length < 40)
        return `<h2 style="${h2Style}">${line}</h2>`;
      if (line.match(/^\[이미지:/))
        return `<div style="margin:12px 0; padding:12px; border:2px dashed #bfdbfe; border-radius:8px; background:#eff6ff; text-align:center; font-size:12px; color:#3b82f6;">${line}</div>`;
      // 해시태그
      if (line.trim().startsWith('#') && line.includes(' #'))
        return `<p style="font-size:14px; line-height:1.8; margin:16px 0 0; color:#3b82f6;">${line}</p>`;
      // 구분선
      if (line.trim().match(/^[-─━=]{3,}$/))
        return '<hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0;"/>';
      if (line.trim() === '') return '<br/>';
      const processed = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      return `<p style="${pStyle}">${processed}</p>`;
    })
    .join('\n');
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    getHistoryItem(id).then((found) => {
      if (!found) {
        router.replace('/history');
        return;
      }
      setItem(found);
      setLoading(false);
    });
  }, [params.id, router]);

  if (loading || !item) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([item.content], { type: 'text/html' }),
          'text/plain': new Blob([item.content_text], { type: 'text/plain' }),
        }),
      ]);
      toast.success('HTML 형식으로 복사되었습니다');
    } catch {
      await navigator.clipboard.writeText(item.content_text);
      toast.success('텍스트로 복사되었습니다');
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(item.content_text);
    toast.success('클립보드에 복사되었습니다');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          뒤로
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-gray-900">{item.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5">{item.keyword}</span>
            <span>{item.options.ai_provider}</span>
            <span>
              {new Date(item.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div
            className="prose prose-sm max-w-none rounded-xl border border-gray-200 bg-white p-6"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(item.content) }}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600"
            >
              HTML 복사 (블로그 붙여넣기)
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              텍스트 복사
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[280px] lg:shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 text-center">
              <p className="text-xs text-gray-500">SEO Score</p>
              <p className={`text-3xl font-bold ${
                item.seo_score.total >= 80 ? 'text-green-600' : item.seo_score.total >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.seo_score.total}
              </p>
            </div>
            <div className="space-y-3">
              <ScoreBar label="제목" score={item.seo_score.title_score} />
              <ScoreBar label="키워드 밀도" score={item.seo_score.keyword_density_score} />
              <ScoreBar label="구조" score={item.seo_score.structure_score} />
              <ScoreBar label="길이" score={item.seo_score.length_score} />
              <ScoreBar label="가독성" score={item.seo_score.readability_score} />
            </div>
            {item.seo_score.suggestions.length > 0 && (
              <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500">개선 제안</p>
                {item.seo_score.suggestions.map((s, i) => (
                  <p key={i} className="text-xs text-gray-600">- {s}</p>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-2 text-xs font-medium text-gray-500">생성 옵션</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>AI: {item.options.ai_provider} ({item.options.ai_model})</p>
              <p>길이: {item.options.length === 'short' ? '짧은글' : item.options.length === 'medium' ? '중간글' : '긴글'}</p>
              <p>문체: {item.options.tone === 'friendly' ? '친근' : item.options.tone === 'professional' ? '전문' : '정보전달'}</p>
              {item.sub_keywords.length > 0 && (
                <p>포함 키워드: {item.sub_keywords.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
