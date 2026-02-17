export const SEO_RULES = {
  title: {
    maxLength: 30,
    keywordRequired: true,
    weight: 0.2,
  },
  keywordDensity: {
    min: 1.5,
    max: 3.5,
    optimal: 2.5,
    weight: 0.25,
  },
  structure: {
    minHeadings: 3,
    maxParagraphSentences: 5,
    weight: 0.2,
  },
  length: {
    short: { min: 800, max: 1200 },
    medium: { min: 1800, max: 2500 },
    long: { min: 2800, max: 3500 },
    weight: 0.2,
  },
  readability: {
    avgSentenceLength: 40,
    weight: 0.15,
  },
} as const;
