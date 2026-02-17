export interface SeoScore {
  total: number;
  title_score: number;
  keyword_density: number;
  keyword_density_score: number;
  structure_score: number;
  length_score: number;
  readability_score: number;
  suggestions: string[];
}

export type ContentLength = 'short' | 'medium' | 'long';
