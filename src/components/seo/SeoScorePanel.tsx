'use client';

import { useGenerateStore } from '@/stores/useGenerateStore';

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
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function SeoScorePanel() {
  const { seoScore, isGenerating } = useGenerateStore();

  if (!seoScore) return null;

  const getTotalColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-center">
        <p className="text-xs text-gray-500">SEO Score</p>
        <p className={`text-3xl font-bold ${getTotalColor(seoScore.total)}`}>
          {seoScore.total}
        </p>
        {seoScore.total >= 80 && (
          <p className="mt-1 text-xs text-green-500">좋은 점수입니다!</p>
        )}
      </div>

      <div className="space-y-3">
        <ScoreBar label="제목" score={seoScore.title_score} />
        <ScoreBar label="키워드 밀도" score={seoScore.keyword_density_score} />
        <ScoreBar label="구조" score={seoScore.structure_score} />
        <ScoreBar label="길이" score={seoScore.length_score} />
        <ScoreBar label="가독성" score={seoScore.readability_score} />
      </div>

      {seoScore.suggestions.length > 0 && !isGenerating && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-amber-600">수정 가이드</p>
          <div className="space-y-2">
            {seoScore.suggestions.map((s, i) => (
              <div key={i} className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                {s}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            편집 버튼을 눌러 직접 수정하면 점수가 실시간 반영됩니다
          </p>
        </div>
      )}
    </div>
  );
}
