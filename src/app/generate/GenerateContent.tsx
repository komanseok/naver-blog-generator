'use client';

import { KeywordInput } from '@/features/content-generator/components/KeywordInput';
import { AiModelSelector } from '@/features/content-generator/components/AiModelSelector';
import { GenerateOptions } from '@/features/content-generator/components/GenerateOptions';
import { GenerateButton } from '@/features/content-generator/components/GenerateButton';
import { ContentPreview } from '@/features/content-generator/components/ContentPreview';
import { SeoScorePanel } from '@/components/seo/SeoScorePanel';

export default function GenerateContent() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Panel - 입력 */}
      <div className="w-full space-y-6 lg:w-[380px] lg:shrink-0">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="mb-5 text-lg font-bold text-gray-900">콘텐츠 생성</h1>
          <div className="space-y-5">
            <KeywordInput />
            <AiModelSelector />
            <GenerateOptions />
            <GenerateButton />
          </div>
        </div>
      </div>

      {/* Right Panel - 결과 */}
      <div className="flex-1 space-y-4">
        <ContentPreview />
        <SeoScorePanel />
      </div>
    </div>
  );
}
