'use client';

import { useGenerateStore } from '@/stores/useGenerateStore';
import { useKeywords } from '@/features/keyword-analyzer/hooks/useKeywords';

export function KeywordInput() {
  const { keyword, setKeyword, selectedKeywords, toggleKeyword } = useGenerateStore();
  const { suggestions } = useKeywords(keyword);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">키워드</label>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="예: 제주도 맛집, 강남 카페"
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        maxLength={50}
      />

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">연관 키워드 (클릭하여 포함)</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const isSelected = selectedKeywords.includes(s.keyword);
              return (
                <button
                  key={s.keyword}
                  type="button"
                  onClick={() => toggleKeyword(s.keyword)}
                  className={`rounded-full px-3 py-1 text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.keyword}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
