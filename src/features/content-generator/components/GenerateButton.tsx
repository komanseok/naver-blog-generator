'use client';

import { useState, useEffect } from 'react';
import { useGenerateStore } from '@/stores/useGenerateStore';
import { useGenerate } from '../hooks/useGenerate';
import { findCachedContent, type HistoryItem } from '@/lib/history/storage';
import { AI_MODELS } from '@/types/ai';
import { toast } from 'sonner';

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  gpt: 'GPT',
  gemini: 'Gemini',
};

export function GenerateButton() {
  const {
    keyword, isGenerating, usage, options,
    setUsage, setAiProvider, setTitle, setContent, setSeoScore,
  } = useGenerateStore();
  const { generate } = useGenerate();
  const [error, setError] = useState<string | null>(null);
  const [quotaFailedProvider, setQuotaFailedProvider] = useState<string | null>(null);
  const [cachedItem, setCachedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => res.json())
      .then((data) => {
        if (data.used !== undefined) setUsage(data);
      })
      .catch(() => {});
  }, [setUsage]);

  const isExhausted = usage !== null && usage.remaining <= 0;

  const doGenerate = async () => {
    setError(null);
    setQuotaFailedProvider(null);
    setCachedItem(null);
    try {
      await generate();
    } catch (e) {
      const message = e instanceof Error ? e.message : '생성에 실패했습니다';
      if (message.startsWith('AI_QUOTA_EXCEEDED:')) {
        setQuotaFailedProvider(message.split(':')[1]);
      } else if (message.includes('횟수')) {
        setError(message);
        if (usage) setUsage({ ...usage, remaining: 0 });
      } else {
        setError(message);
        toast.error(message);
      }
    }
  };

  const handleClick = async () => {
    if (!keyword.trim()) {
      toast.error('키워드를 입력해주세요');
      return;
    }

    // 캐시 확인
    try {
      const cached = await findCachedContent(keyword.trim(), {
        length: options.length,
        tone: options.tone,
      });
      if (cached) {
        setCachedItem(cached);
        return;
      }
    } catch {
      // 캐시 조회 실패 시 무시하고 새로 생성
    }

    await doGenerate();
  };

  const handleUseCached = () => {
    if (!cachedItem) return;
    setTitle(cachedItem.title);
    setContent(cachedItem.content);
    setSeoScore(cachedItem.seo_score);
    setCachedItem(null);
    toast.success('이전 결과를 불러왔습니다 (사용량 차감 없음)');
  };

  const handleGenerateNew = async () => {
    setCachedItem(null);
    await doGenerate();
  };

  const alternativeModels = AI_MODELS.filter(
    (m) => m.provider !== quotaFailedProvider && m.provider !== 'mock'
  );

  const cachedDate = cachedItem
    ? new Date(cachedItem.created_at).toLocaleDateString('ko-KR', {
        month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="space-y-3">
      {/* 일일 사용량 표시 */}
      {usage && (
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-500">오늘 사용량</span>
            <span className={`font-semibold ${isExhausted ? 'text-red-500' : 'text-gray-700'}`}>
              {usage.used} / {usage.limit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExhausted
                  ? 'bg-red-400'
                  : usage.used / usage.limit > 0.8
                    ? 'bg-amber-400'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
            />
          </div>
          {!isExhausted && (
            <p className="mt-1 text-right text-[11px] text-gray-400">
              {usage.remaining}회 남음
            </p>
          )}
        </div>
      )}

      {/* 캐시 발견 시 선택지 */}
      {cachedItem ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
          <p className="text-sm font-semibold text-blue-700">
            동일 키워드로 생성한 결과가 있어요
          </p>
          <p className="mt-1 text-xs text-blue-500">
            &ldquo;{cachedItem.title}&rdquo; · {cachedDate}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleUseCached}
              className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600"
            >
              이전 결과 사용 (무료)
            </button>
            <button
              type="button"
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-medium text-blue-700 ring-1 ring-blue-300 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {isGenerating ? '생성 중...' : '새로 생성 (1회 차감)'}
            </button>
          </div>
        </div>
      ) : isExhausted ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-4 text-center">
          <div className="mb-2 text-2xl">
            <svg className="mx-auto h-10 w-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-red-600">
            오늘의 생성 횟수를 모두 사용했어요
          </p>
          <p className="mt-1 text-xs text-red-400">
            매일 자정에 {usage!.limit}회가 초기화됩니다
          </p>
          {usage!.isGuest && (
            <a
              href="/login"
              className="mt-2 inline-block rounded-md bg-blue-500 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600"
            >
              로그인하면 20회까지 사용 가능
            </a>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isGenerating || !keyword.trim()}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              생성 중...
            </span>
          ) : (
            '콘텐츠 생성하기'
          )}
        </button>
      )}

      {/* API 토큰 소진 안내 */}
      {quotaFailedProvider && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-semibold text-amber-700">
            {PROVIDER_LABELS[quotaFailedProvider] || quotaFailedProvider} API 사용량이 소진되었습니다
          </p>
          <p className="mt-1 text-xs text-amber-600">
            다른 AI 모델로 변경하면 계속 사용할 수 있어요
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {alternativeModels.map((m) => (
              <button
                key={m.model}
                type="button"
                onClick={() => {
                  setAiProvider(m.provider, m.model);
                  setQuotaFailedProvider(null);
                  toast.success(`${m.label}로 변경되었습니다`);
                }}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm ring-1 ring-amber-300 transition hover:bg-amber-100"
              >
                {m.label} 사용하기
              </button>
            ))}
          </div>
        </div>
      )}

      {error && !isExhausted && !quotaFailedProvider && (
        <p className="text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
