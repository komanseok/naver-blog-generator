'use client';

import { useGenerateStore } from '@/stores/useGenerateStore';

const LENGTH_OPTIONS = [
  { value: 'short' as const, label: '짧은글', desc: '~1,000자' },
  { value: 'medium' as const, label: '중간', desc: '~2,000자' },
  { value: 'long' as const, label: '긴글', desc: '~3,000자' },
];

const TONE_OPTIONS = [
  { value: 'friendly' as const, label: '친근한', desc: '~요, ~죠' },
  { value: 'professional' as const, label: '전문적', desc: '~합니다' },
  { value: 'informative' as const, label: '정보전달', desc: '~이다' },
];

export function GenerateOptions() {
  const { options, setOption } = useGenerateStore();

  return (
    <div className="space-y-4">
      {/* 길이 옵션 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">글 길이</label>
        <div className="grid grid-cols-3 gap-2">
          {LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOption('length', opt.value)}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition-all ${
                options.length === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-gray-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 문체 옵션 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">문체</label>
        <div className="grid grid-cols-3 gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOption('tone', opt.value)}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition-all ${
                options.tone === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-gray-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CTA 토글 */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={options.include_cta}
          onChange={(e) => setOption('include_cta', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-gray-600">CTA(행동유도) 포함</span>
      </label>
    </div>
  );
}
