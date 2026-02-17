import type { AiProviderType } from './ai';
import type { SeoScore } from './seo';

export interface GenerateOptions {
  ai_provider: AiProviderType;
  ai_model: string;
  length: 'short' | 'medium' | 'long';
  tone: 'friendly' | 'professional' | 'informative';
  include_keywords: string[];
  include_cta: boolean;
}

export interface GeneratedContent {
  id: string;
  user_id: string;
  keyword: string;
  sub_keywords: string[];
  title: string;
  content: string;
  content_text: string;
  options: GenerateOptions;
  seo_score: SeoScore;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerateRequest {
  keyword: string;
  options: GenerateOptions;
}

export interface StreamEvent {
  type: 'title' | 'content_chunk' | 'seo_score' | 'done' | 'error';
  content: string;
  content_id?: string;
}
