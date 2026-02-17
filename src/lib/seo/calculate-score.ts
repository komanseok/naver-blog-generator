import type { SeoScore, ContentLength } from '@/types/seo';
import { SEO_RULES } from './seo-rules';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function calcTitleScore(keyword: string, title: string): number {
  let score = 0;
  const lowerTitle = title.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  // 키워드 포함 여부 (50점)
  if (lowerTitle.includes(lowerKeyword)) {
    score += 50;
    // 키워드가 앞부분에 있으면 추가 점수 (20점)
    if (lowerTitle.indexOf(lowerKeyword) < lowerTitle.length / 2) {
      score += 20;
    }
  }

  // 길이 적합성 (30점)
  const titleLen = title.length;
  if (titleLen > 0 && titleLen <= SEO_RULES.title.maxLength) {
    score += 30;
  } else if (titleLen > SEO_RULES.title.maxLength && titleLen <= 40) {
    score += 15;
  }

  return Math.min(100, score);
}

function calcKeywordDensity(keyword: string, text: string): number {
  if (!text || !keyword) return 0;
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const keywordCount = lowerText.split(lowerKeyword).length - 1;
  const totalChars = lowerText.length;
  if (totalChars === 0) return 0;
  return (keywordCount * lowerKeyword.length / totalChars) * 100;
}

function calcDensityScore(density: number): number {
  const { min, max, optimal } = SEO_RULES.keywordDensity;
  if (density >= min && density <= max) {
    const distance = Math.abs(density - optimal);
    const maxDistance = Math.max(optimal - min, max - optimal);
    return Math.round(100 - (distance / maxDistance) * 30);
  }
  if (density < min) {
    return Math.max(0, Math.round((density / min) * 60));
  }
  // density > max (과다 사용)
  return Math.max(0, Math.round(60 - (density - max) * 20));
}

function calcStructureScore(text: string): number {
  let score = 0;

  // 소제목 수 체크
  const headingMatches = text.match(/#{2,3}\s/g) || text.match(/<h[23][^>]*>/g) || [];
  const headingCount = headingMatches.length;

  if (headingCount >= SEO_RULES.structure.minHeadings) {
    score += 60;
  } else if (headingCount > 0) {
    score += Math.round((headingCount / SEO_RULES.structure.minHeadings) * 60);
  }

  // 문단 구분 체크
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 5) {
    score += 40;
  } else if (paragraphs.length >= 3) {
    score += 25;
  } else if (paragraphs.length >= 1) {
    score += 10;
  }

  return Math.min(100, score);
}

function calcLengthScore(text: string, contentLength: ContentLength): number {
  const plainText = stripHtml(text);
  const charCount = plainText.length;
  const range = SEO_RULES.length[contentLength];

  if (charCount >= range.min && charCount <= range.max) {
    return 100;
  }
  if (charCount < range.min) {
    return Math.max(0, Math.round((charCount / range.min) * 80));
  }
  // 길이 초과 (약간의 감점)
  const overRatio = (charCount - range.max) / range.max;
  return Math.max(50, Math.round(100 - overRatio * 50));
}

function calcReadabilityScore(text: string): number {
  const plainText = stripHtml(text);
  const sentences = plainText.split(/[.!?。]\s*/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  const avgLen = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  const target = SEO_RULES.readability.avgSentenceLength;

  if (avgLen <= target) {
    return Math.round(80 + (avgLen / target) * 20);
  }
  const overRatio = (avgLen - target) / target;
  return Math.max(30, Math.round(100 - overRatio * 60));
}

function generateSuggestions(params: {
  keyword: string;
  title: string;
  charCount: number;
  contentLength: ContentLength;
  titleScore: number;
  density: number;
  structureScore: number;
  lengthScore: number;
  readabilityScore: number;
  headingCount: number;
  avgSentenceLen: number;
}): string[] {
  const suggestions: string[] = [];

  if (params.titleScore < 70) {
    if (!params.title.toLowerCase().includes(params.keyword.toLowerCase())) {
      suggestions.push(`제목에 "${params.keyword}" 키워드를 앞부분에 넣으세요 (현재 제목: ${params.title.length}자)`);
    } else if (params.title.length > SEO_RULES.title.maxLength) {
      suggestions.push(`제목을 ${SEO_RULES.title.maxLength}자 이내로 줄이세요 (현재 ${params.title.length}자)`);
    }
  }

  const { min, max } = SEO_RULES.keywordDensity;
  if (params.density < min) {
    const currentCount = Math.round(params.density * params.charCount / (params.keyword.length * 100));
    const targetCount = Math.ceil(min * params.charCount / (params.keyword.length * 100));
    suggestions.push(`"${params.keyword}"를 ${targetCount - currentCount}회 더 추가하세요 (현재 ${currentCount}회, 목표 ${targetCount}회)`);
  }
  if (params.density > max) {
    suggestions.push(`"${params.keyword}" 사용이 과다합니다. 일부를 유사어로 교체하세요 (밀도 ${params.density.toFixed(1)}% → 목표 ${max}% 이하)`);
  }

  if (params.structureScore < 70) {
    const need = SEO_RULES.structure.minHeadings - params.headingCount;
    if (need > 0) {
      suggestions.push(`소제목을 ${need}개 더 추가하세요 (현재 ${params.headingCount}개, 권장 ${SEO_RULES.structure.minHeadings}개 이상)`);
    }
  }

  const range = SEO_RULES.length[params.contentLength];
  if (params.lengthScore < 70) {
    if (params.charCount < range.min) {
      suggestions.push(`본문을 ${range.min - params.charCount}자 더 작성하세요 (현재 ${params.charCount}자, 목표 ${range.min}~${range.max}자)`);
    }
  }

  if (params.readabilityScore < 70) {
    suggestions.push(`긴 문장을 나누세요 (평균 ${Math.round(params.avgSentenceLen)}자 → 목표 ${SEO_RULES.readability.avgSentenceLength}자 이하)`);
  }

  return suggestions;
}

export function calculateSeoScore(params: {
  keyword: string;
  title: string;
  content: string;
  contentLength: ContentLength;
}): SeoScore {
  const plainText = stripHtml(params.content);
  const titleScore = calcTitleScore(params.keyword, params.title);
  const density = calcKeywordDensity(params.keyword, plainText);
  const densityScore = calcDensityScore(density);
  const structureScore = calcStructureScore(params.content);
  const lengthScore = calcLengthScore(params.content, params.contentLength);
  const readabilityScore = calcReadabilityScore(plainText);

  const total = Math.round(
    titleScore * SEO_RULES.title.weight +
    densityScore * SEO_RULES.keywordDensity.weight +
    structureScore * SEO_RULES.structure.weight +
    lengthScore * SEO_RULES.length.weight +
    readabilityScore * SEO_RULES.readability.weight
  );

  const headingMatches = params.content.match(/#{2,3}\s/g) || params.content.match(/<h[23][^>]*>/g) || [];
  const sentences = plainText.split(/[.!?。]\s*/).filter(s => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    : 0;

  const suggestions = generateSuggestions({
    keyword: params.keyword,
    title: params.title,
    charCount: plainText.length,
    contentLength: params.contentLength,
    titleScore,
    density,
    structureScore,
    lengthScore,
    readabilityScore,
    headingCount: headingMatches.length,
    avgSentenceLen,
  });

  return {
    total,
    title_score: titleScore,
    keyword_density: Math.round(density * 100) / 100,
    keyword_density_score: densityScore,
    structure_score: structureScore,
    length_score: lengthScore,
    readability_score: readabilityScore,
    suggestions,
  };
}
