'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getHistoryList, deleteHistoryItem, type HistoryItem } from '@/lib/history/storage';
import { toast } from 'sonner';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 60
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      SEO {score}
    </span>
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (pageNum: number, reset = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const result = await getHistoryList(pageNum);

    setItems((prev) => reset ? result.items : [...prev, ...result.items]);
    setHasMore(result.hasMore);
    setPage(pageNum);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadPage(0, true);
  }, [loadPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPage(page + 1);
        }
      },
      { rootMargin: '200px' },
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore, page, loadPage]);

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await deleteHistoryItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('삭제되었습니다');
  };

  const filtered = search
    ? items.filter(
        (item) =>
          item.keyword.includes(search) ||
          item.title.includes(search),
      )
    : items;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">생성 히스토리</h1>
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-500">아직 저장된 콘텐츠가 없습니다</p>
            <p className="mt-1 text-xs text-gray-400">
              콘텐츠를 생성한 후 저장 버튼을 눌러주세요
            </p>
            <Link
              href="/generate"
              className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              콘텐츠 생성하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">생성 히스토리</h1>
        <span className="text-sm text-gray-500">{items.length}개{hasMore ? '+' : ''}</span>
      </div>

      <input
        type="text"
        placeholder="키워드 또는 제목으로 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
      />

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-gray-900">
                  {item.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {item.keyword}
                  </span>
                  <ScoreBadge score={item.seo_score.total} />
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.options.ai_provider}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {item.content_text.slice(0, 150)}...
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/history/${item.id}`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  보기
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && search && (
          <p className="py-8 text-center text-sm text-gray-400">
            &quot;{search}&quot; 검색 결과가 없습니다
          </p>
        )}

        {/* Infinite scroll trigger */}
        {!search && hasMore && (
          <div ref={observerRef} className="flex justify-center py-4">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                불러오는 중...
              </div>
            ) : (
              <span className="text-xs text-gray-300">스크롤하면 더 불러옵니다</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
