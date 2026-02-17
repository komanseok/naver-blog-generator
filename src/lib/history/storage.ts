import { createClient } from '@/lib/supabase/client';
import type { GenerateOptions } from '@/types/content';
import type { SeoScore } from '@/types/seo';

export interface HistoryItem {
  id: string;
  keyword: string;
  sub_keywords: string[];
  title: string;
  content: string;
  content_text: string;
  options: GenerateOptions;
  seo_score: SeoScore;
  is_edited: boolean;
  created_at: string;
}

export async function saveToHistory(
  item: Omit<HistoryItem, 'id' | 'created_at'>,
): Promise<HistoryItem | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 비로그인 시 localStorage fallback
    return saveToLocalStorage(item);
  }

  const { data, error } = await supabase
    .from('generated_contents')
    .insert({
      user_id: user.id,
      keyword: item.keyword,
      sub_keywords: item.sub_keywords,
      title: item.title,
      content: item.content,
      content_text: item.content_text,
      options: item.options,
      seo_score: item.seo_score,
      is_edited: item.is_edited,
    })
    .select()
    .single();

  if (error) {
    console.error('Save error:', error);
    return saveToLocalStorage(item);
  }

  return {
    id: data.id,
    keyword: data.keyword,
    sub_keywords: data.sub_keywords,
    title: data.title,
    content: data.content,
    content_text: data.content_text,
    options: data.options as GenerateOptions,
    seo_score: data.seo_score as SeoScore,
    is_edited: data.is_edited,
    created_at: data.created_at,
  };
}

export const PAGE_SIZE = 15;

export async function getHistoryList(page = 0): Promise<{ items: HistoryItem[]; hasMore: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const all = getFromLocalStorage();
    const start = page * PAGE_SIZE;
    const items = all.slice(start, start + PAGE_SIZE);
    return { items, hasMore: start + PAGE_SIZE < all.length };
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  const { data, error } = await supabase
    .from('generated_contents')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Fetch error:', error);
    return { items: [], hasMore: false };
  }

  const hasMore = data.length > PAGE_SIZE;
  const sliced = hasMore ? data.slice(0, PAGE_SIZE) : data;

  return {
    items: sliced.map((row) => ({
      id: row.id,
      keyword: row.keyword,
      sub_keywords: row.sub_keywords,
      title: row.title,
      content: row.content,
      content_text: row.content_text,
      options: row.options as GenerateOptions,
      seo_score: row.seo_score as SeoScore,
      is_edited: row.is_edited,
      created_at: row.created_at,
    })),
    hasMore,
  };
}

export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const items = getFromLocalStorage();
    return items.find((item) => item.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('generated_contents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    keyword: data.keyword,
    sub_keywords: data.sub_keywords,
    title: data.title,
    content: data.content,
    content_text: data.content_text,
    options: data.options as GenerateOptions,
    seo_score: data.seo_score as SeoScore,
    is_edited: data.is_edited,
    created_at: data.created_at,
  };
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return deleteFromLocalStorage(id);
  }

  const { error } = await supabase
    .from('generated_contents')
    .delete()
    .eq('id', id);

  return !error;
}

// 캐시: 동일 키워드+옵션 조합 조회
export async function findCachedContent(
  keyword: string,
  options: { length: string; tone: string },
): Promise<HistoryItem | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const items = getFromLocalStorage();
    return items.find(
      (item) =>
        item.keyword === keyword &&
        item.options.length === options.length &&
        item.options.tone === options.tone &&
        !item.is_edited,
    ) ?? null;
  }

  const { data } = await supabase
    .from('generated_contents')
    .select('*')
    .eq('keyword', keyword)
    .eq('is_edited', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return null;

  const match = data.find(
    (row) => {
      const opts = row.options as GenerateOptions;
      return opts.length === options.length && opts.tone === options.tone;
    },
  );

  if (!match) return null;

  return {
    id: match.id,
    keyword: match.keyword,
    sub_keywords: match.sub_keywords,
    title: match.title,
    content: match.content,
    content_text: match.content_text,
    options: match.options as GenerateOptions,
    seo_score: match.seo_score as SeoScore,
    is_edited: match.is_edited,
    created_at: match.created_at,
  };
}

// localStorage fallback (비로그인용)
const STORAGE_KEY = 'blogai-history';

function getFromLocalStorage(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(item: Omit<HistoryItem, 'id' | 'created_at'>): HistoryItem {
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const history = getFromLocalStorage();
  history.unshift(newItem);
  if (history.length > 20) history.length = 20;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return newItem;
}

function deleteFromLocalStorage(id: string): boolean {
  const history = getFromLocalStorage();
  const filtered = history.filter((item) => item.id !== id);
  if (filtered.length === history.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
