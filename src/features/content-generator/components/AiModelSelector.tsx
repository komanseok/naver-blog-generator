'use client';

import { AI_MODELS } from '@/types/ai';
import { useGenerateStore } from '@/stores/useGenerateStore';

export function AiModelSelector() {
  const { options, setAiProvider } = useGenerateStore();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">AI 모델</label>
      <div className="grid grid-cols-2 gap-2">
        {AI_MODELS.map((model) => {
          const isSelected = options.ai_provider === model.provider;
          return (
            <button
              key={model.provider}
              type="button"
              onClick={() => setAiProvider(model.provider, model.model)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold">{model.label}</div>
              <div className="mt-1 text-xs text-gray-500">{model.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
