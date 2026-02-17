import { create } from 'zustand';
import type { GenerateOptions } from '@/types/content';
import type { SeoScore } from '@/types/seo';
import type { AiProviderType } from '@/types/ai';

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isGuest?: boolean;
}

interface GenerateState {
  // 입력
  keyword: string;
  selectedKeywords: string[];
  options: GenerateOptions;

  // 생성 상태
  isGenerating: boolean;
  title: string;
  content: string;
  seoScore: SeoScore | null;

  // 사용량
  usage: UsageInfo | null;

  // 액션
  setKeyword: (keyword: string) => void;
  setSelectedKeywords: (keywords: string[]) => void;
  toggleKeyword: (keyword: string) => void;
  setOption: <K extends keyof GenerateOptions>(key: K, value: GenerateOptions[K]) => void;
  setAiProvider: (provider: AiProviderType, model: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setTitle: (title: string) => void;
  appendContent: (chunk: string) => void;
  setContent: (content: string) => void;
  setSeoScore: (score: SeoScore) => void;
  setUsage: (usage: UsageInfo) => void;
  reset: () => void;
}

const defaultOptions: GenerateOptions = {
  ai_provider: 'gemini',
  ai_model: 'gemini-2.5-flash',
  length: 'medium',
  tone: 'friendly',
  include_keywords: [],
  include_cta: true,
};

export const useGenerateStore = create<GenerateState>((set) => ({
  keyword: '',
  selectedKeywords: [],
  options: { ...defaultOptions },
  isGenerating: false,
  title: '',
  content: '',
  seoScore: null,
  usage: null,

  setKeyword: (keyword) => set({ keyword }),
  setSelectedKeywords: (keywords) =>
    set((state) => ({
      selectedKeywords: keywords,
      options: { ...state.options, include_keywords: keywords },
    })),
  toggleKeyword: (keyword) =>
    set((state) => {
      const exists = state.selectedKeywords.includes(keyword);
      const newKeywords = exists
        ? state.selectedKeywords.filter((k) => k !== keyword)
        : [...state.selectedKeywords, keyword];
      return {
        selectedKeywords: newKeywords,
        options: { ...state.options, include_keywords: newKeywords },
      };
    }),
  setOption: (key, value) =>
    set((state) => ({ options: { ...state.options, [key]: value } })),
  setAiProvider: (provider, model) =>
    set((state) => ({
      options: { ...state.options, ai_provider: provider, ai_model: model },
    })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setTitle: (title) => set({ title }),
  appendContent: (chunk) => set((state) => ({ content: state.content + chunk })),
  setContent: (content) => set({ content }),
  setSeoScore: (seoScore) => set({ seoScore }),
  setUsage: (usage) => set({ usage }),
  reset: () =>
    set({
      title: '',
      content: '',
      seoScore: null,
      isGenerating: false,
    }),
}));
