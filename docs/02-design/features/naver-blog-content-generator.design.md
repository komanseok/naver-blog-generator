# 네이버 블로그 콘텐츠 자동 생성 앱 Design Document

> **Summary**: AI 기반 네이버 SEO 최적화 블로그 콘텐츠 자동 생성 웹앱 설계
>
> **Project**: blogA
> **Version**: 0.1.0
> **Author**: User
> **Date**: 2026-02-16
> **Status**: Draft
> **Planning Doc**: [naver-blog-content-generator.plan.md](../01-plan/features/naver-blog-content-generator.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A |
| Phase 2 | Coding Conventions | N/A |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | 이 문서에 포함 |

---

## 1. Overview

### 1.1 Design Goals

- 키워드 입력부터 콘텐츠 복사까지 **3단계 이내** 완료되는 간결한 UX
- 네이버 SEO 규칙을 **설정 파일로 분리**하여 알고리즘 변경 시 빠르게 대응
- AI 생성 콘텐츠의 **스트리밍 출력**으로 대기 시간 체감 최소화
- 콘텐츠 편집 → SEO 점수 **실시간 반영**

### 1.2 Design Principles

- **Feature-based Modularity**: 콘텐츠 생성, 키워드 분석, SEO 최적화를 독립 모듈로 분리
- **Multi-AI Provider**: Claude, GPT, Gemini 3가지 AI 모델 선택 지원, Provider 패턴으로 확장 용이
- **Server-side AI**: 모든 AI API Key를 서버에서만 관리, 클라이언트 노출 방지
- **Progressive Enhancement**: 핵심 기능(생성/복사)을 먼저, 부가 기능(히스토리/편집)은 점진적 추가
- **Streaming First**: AI 응답을 스트리밍으로 처리하여 UX 개선

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ Generate  │  │  SEO Score   │  │   Content Editor   │     │
│  │   Form    │  │   Panel      │  │    (TipTap)        │     │
│  └────┬─────┘  └──────┬───────┘  └────────┬───────────┘     │
│       │               │                    │                 │
│  ┌────▼───────────────▼────────────────────▼───────────┐     │
│  │              Zustand Store                           │     │
│  │  (generationState, seoScore, contentHistory)        │     │
│  └────────────────────┬────────────────────────────────┘     │
└───────────────────────┼──────────────────────────────────────┘
                        │ fetch (streaming)
┌───────────────────────▼──────────────────────────────────────┐
│                   Next.js API Routes                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ /api/generate │  │/api/keywords │  │/api/seo-score│       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
│  ┌──────▼──────────┐ ┌───────▼───────┐ ┌──────▼───────┐      │
│  │ AI Provider     │ │ Naver Suggest │ │  SEO Engine   │      │
│  │ Router          │ │  API/Scraper  │ │  (Local Calc) │      │
│  │ ┌─────┬───┬───┐│ └───────────────┘ └──────────────┘      │
│  │ │Claude│GPT│Gem││                                         │
│  │ └─────┴───┴───┘│                                         │
│  └──────┬──────────┘                                         │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────┐         │
│  │            Supabase (PostgreSQL)                 │         │
│  │  users / contents / generation_history           │         │
│  └─────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. 콘텐츠 생성 Flow:
   [키워드 입력] → [POST /api/generate] → [AI Provider Router (Claude/GPT/Gemini)]
                                           → [SSE로 클라이언트 전송]
                                           → [SEO 점수 자동 계산]
                                           → [Supabase 히스토리 저장]

2. 키워드 추천 Flow:
   [키워드 입력 (debounce 300ms)] → [GET /api/keywords?q=...]
                                     → [네이버 자동완성 API]
                                     → [연관 키워드 리스트 반환]

3. SEO 점수 Flow:
   [콘텐츠 편집 (debounce 500ms)] → [POST /api/seo-score]
                                     → [로컬 SEO 엔진 계산]
                                     → [점수 + 개선 제안 반환]
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| GenerateForm | Zustand Store, Keywords API | 키워드 입력 + 옵션 설정 |
| ContentEditor | TipTap, Zustand Store | 생성된 콘텐츠 편집 |
| SeoScorePanel | SEO Engine, Zustand Store | SEO 점수 실시간 표시 |
| Generate API | AI Provider (Claude/GPT/Gemini), Supabase | AI 콘텐츠 생성 + 저장 |
| Keywords API | Naver Suggest | 연관 키워드 추천 |

---

## 3. Data Model

### 3.1 Entity Definitions

```typescript
// 사용자
interface User {
  id: string;                    // Supabase Auth UUID
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// 생성된 콘텐츠
interface GeneratedContent {
  id: string;                    // UUID
  user_id: string;               // FK → users
  keyword: string;               // 메인 키워드
  sub_keywords: string[];        // 연관 키워드
  title: string;                 // 생성된 제목
  content: string;               // 생성된 본문 (HTML)
  content_text: string;          // 본문 (plain text, SEO 분석용)
  options: GenerateOptions;      // 생성 옵션
  seo_score: SeoScore;           // SEO 분석 결과
  is_edited: boolean;            // 사용자 편집 여부
  created_at: string;
  updated_at: string;
}

// AI 프로바이더 타입
type AiProvider = 'claude' | 'gpt' | 'gemini';

// AI 모델별 상세 모델
interface AiModelConfig {
  provider: AiProvider;
  model: string;              // e.g., 'claude-sonnet-4-5-20250929', 'gpt-4o', 'gemini-2.0-flash'
  label: string;              // UI 표시명
  description: string;        // 모델 설명
  maxTokens: number;          // 최대 출력 토큰
}

// 지원 모델 목록
const AI_MODELS: AiModelConfig[] = [
  { provider: 'claude', model: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', description: '한국어 품질 우수, 자연스러운 문체', maxTokens: 8192 },
  { provider: 'gpt', model: 'gpt-4o', label: 'GPT-4o', description: '범용 고성능, 빠른 응답', maxTokens: 4096 },
  { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: '빠른 속도, 비용 효율적', maxTokens: 8192 },
];

// 생성 옵션
interface GenerateOptions {
  ai_provider: AiProvider;                  // 사용할 AI 모델
  ai_model: string;                         // 상세 모델명
  length: 'short' | 'medium' | 'long';     // 짧은글(1000자) / 중간(2000자) / 긴글(3000자)
  tone: 'friendly' | 'professional' | 'informative';  // 친근 / 전문 / 정보전달
  include_keywords: string[];               // 반드시 포함할 키워드
  include_cta: boolean;                     // CTA(행동유도) 포함 여부
}

// SEO 점수
interface SeoScore {
  total: number;                 // 종합 점수 (0~100)
  title_score: number;           // 제목 점수 (0~100)
  keyword_density: number;       // 키워드 밀도 (%)
  keyword_density_score: number; // 키워드 밀도 점수 (0~100)
  structure_score: number;       // 구조 점수 (소제목, 문단) (0~100)
  length_score: number;          // 길이 점수 (0~100)
  readability_score: number;     // 가독성 점수 (0~100)
  suggestions: string[];         // 개선 제안 목록
}

// 키워드 추천 결과
interface KeywordSuggestion {
  keyword: string;               // 추천 키워드
  source: 'autocomplete' | 'related';  // 출처
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── N [GeneratedContent]
                      │
                      ├── has one [GenerateOptions] (JSON)
                      └── has one [SeoScore] (JSON)
```

### 3.3 Database Schema (Supabase PostgreSQL)

```sql
-- 생성 콘텐츠 테이블
CREATE TABLE generated_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  sub_keywords TEXT[] DEFAULT '{}',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '{}',
  seo_score JSONB NOT NULL DEFAULT '{}',
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_contents_user_id ON generated_contents(user_id);
CREATE INDEX idx_contents_keyword ON generated_contents(keyword);
CREATE INDEX idx_contents_created_at ON generated_contents(created_at DESC);

-- RLS 정책 (자신의 콘텐츠만 접근)
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contents"
  ON generated_contents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contents"
  ON generated_contents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contents"
  ON generated_contents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contents"
  ON generated_contents FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth | Response |
|--------|------|-------------|------|----------|
| POST | `/api/generate` | AI 콘텐츠 생성 (스트리밍) | Required | SSE Stream |
| GET | `/api/keywords` | 연관 키워드 추천 | Optional | JSON |
| POST | `/api/seo-score` | SEO 점수 계산 | Optional | JSON |
| GET | `/api/history` | 생성 히스토리 조회 | Required | JSON |
| GET | `/api/history/[id]` | 콘텐츠 상세 조회 | Required | JSON |
| DELETE | `/api/history/[id]` | 콘텐츠 삭제 | Required | JSON |

### 4.2 Detailed Specifications

#### `POST /api/generate` — 콘텐츠 생성 (핵심 API)

**Request:**
```json
{
  "keyword": "제주도 맛집",
  "options": {
    "ai_provider": "claude",
    "ai_model": "claude-sonnet-4-5-20250929",
    "length": "medium",
    "tone": "friendly",
    "include_keywords": ["제주도 카페", "제주 흑돼지"],
    "include_cta": true
  }
}
```

**Response (SSE Stream):**
```
data: {"type": "title", "content": "제주도 맛집 베스트 10! 현지인이 추천하는 숨은 맛집 총정리"}

data: {"type": "content_chunk", "content": "제주도 여행을 계획하고 계신가요? ..."}

data: {"type": "content_chunk", "content": "## 1. 흑돼지 거리에서 꼭 가봐야 할 곳\n\n..."}

data: {"type": "seo_score", "content": {"total": 87, "title_score": 90, ...}}

data: {"type": "done", "content_id": "uuid-here"}
```

**Error Responses:**
- `400`: 키워드 미입력 또는 유효하지 않은 옵션
- `401`: 로그인 필요
- `429`: 생성 횟수 제한 초과 (비로그인: 3회/일, 로그인: 20회/일)
- `500`: AI API 오류

#### `GET /api/keywords?q={keyword}` — 키워드 추천

**Response (200):**
```json
{
  "suggestions": [
    { "keyword": "제주도 맛집 추천", "source": "autocomplete" },
    { "keyword": "제주도 맛집 현지인", "source": "autocomplete" },
    { "keyword": "제주 흑돼지 맛집", "source": "related" },
    { "keyword": "제주도 카페 맛집", "source": "related" }
  ]
}
```

#### `POST /api/seo-score` — SEO 점수 계산

**Request:**
```json
{
  "keyword": "제주도 맛집",
  "title": "제주도 맛집 베스트 10! 현지인 추천 숨은 맛집",
  "content": "<h2>1. 흑돼지 거리</h2><p>제주도에서...</p>..."
}
```

**Response (200):**
```json
{
  "total": 87,
  "title_score": 90,
  "keyword_density": 2.3,
  "keyword_density_score": 95,
  "structure_score": 80,
  "length_score": 85,
  "readability_score": 82,
  "suggestions": [
    "소제목을 1개 더 추가하면 구조 점수가 올라갑니다",
    "본문 길이를 200자 더 늘리면 최적 범위에 도달합니다"
  ]
}
```

#### `GET /api/history?page={n}&limit={n}` — 히스토리 조회

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "keyword": "제주도 맛집",
      "title": "제주도 맛집 베스트 10!...",
      "seo_score": { "total": 87 },
      "created_at": "2026-02-16T14:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

## 5. UI/UX Design

### 5.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: 로고 | 생성 | 히스토리 | [로그인/프로필]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /generate (메인 - 콘텐츠 생성 페이지)                       │
│  ┌─────────────────────────┬───────────────────────────┐    │
│  │   Left Panel (입력)     │   Right Panel (결과)       │    │
│  │                         │                           │    │
│  │  [키워드 입력 ________] │   제목 미리보기            │    │
│  │                         │   ─────────────────       │    │
│  │  연관 키워드 추천:       │                           │    │
│  │  [제주맛집] [제주카페]   │   본문 콘텐츠              │    │
│  │                         │   (TipTap Editor)         │    │
│  │  AI 모델:               │                           │    │
│  │  [Claude▼] [GPT] [Gem]  │                           │    │
│  │                         │                           │    │
│  │  옵션:                  │                           │    │
│  │  길이: ○짧은 ●중간 ○긴  │                           │    │
│  │  문체: ○친근 ●전문 ○정보│                           │    │
│  │                         │                           │    │
│  │  [✨ 콘텐츠 생성하기]   │   ┌─────────────────┐     │    │
│  │                         │   │  SEO Score: 87  │     │    │
│  │                         │   │  ■■■■■■■■□□     │     │    │
│  │                         │   │  제목: 90       │     │    │
│  │                         │   │  키워드: 95     │     │    │
│  │                         │   │  구조: 80       │     │    │
│  │                         │   │  길이: 85       │     │    │
│  │                         │   └─────────────────┘     │    │
│  │                         │                           │    │
│  │                         │   [📋 복사하기] [💾 저장] │    │
│  └─────────────────────────┴───────────────────────────┘    │
│                                                             │
│  /history (히스토리 페이지)                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 검색: [________]  정렬: [최신순 ▼]                   │    │
│  │                                                     │    │
│  │ ┌───────────────────────────────────────────────┐   │    │
│  │ │ 제주도 맛집 베스트 10!        SEO: 87  2/16  │   │    │
│  │ │ 키워드: 제주도 맛집            [보기] [삭제]   │   │    │
│  │ ├───────────────────────────────────────────────┤   │    │
│  │ │ 강남 카페 추천 TOP 5          SEO: 92  2/15  │   │    │
│  │ │ 키워드: 강남 카페              [보기] [삭제]   │   │    │
│  │ └───────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 모바일 레이아웃 (반응형)

```
┌─────────────────────┐
│ ☰  blogA     [로그인]│
├─────────────────────┤
│                     │
│ [키워드 입력 _____] │
│                     │
│ 추천: [맛집] [카페] │
│                     │
│ AI: [Claude▼][GPT]  │
│     [Gemini]        │
│                     │
│ 길이: ○짧 ●중 ○긴  │
│ 문체: ●친근 ○전문   │
│                     │
│ [✨ 생성하기]       │
│                     │
│ ─── 결과 ────────── │
│                     │
│ SEO Score: 87/100   │
│ ■■■■■■■■□□          │
│                     │
│ 제목: ...           │
│ 본문: ...           │
│                     │
│ [📋 복사] [💾 저장] │
│                     │
└─────────────────────┘
```

### 5.3 User Flow

```
[Landing] → [로그인/회원가입] → [생성 페이지]
                                     │
                    ┌────────────────┤
                    ▼                ▼
             [키워드 입력]     [히스토리 조회]
                    │                │
                    ▼                ▼
             [옵션 선택]       [과거 콘텐츠 보기]
                    │                │
                    ▼                ▼
             [AI 생성 시작]    [편집/복사]
                    │
                    ▼
             [스트리밍 결과 표시]
                    │
              ┌─────┼─────┐
              ▼     ▼     ▼
           [편집] [복사] [재생성]
```

### 5.4 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `KeywordInput` | `src/features/content-generator/components/` | 키워드 입력 + 자동완성 |
| `KeywordChips` | `src/features/keyword-analyzer/components/` | 연관 키워드 칩 표시 |
| `AiModelSelector` | `src/features/content-generator/components/` | AI 모델 선택 (Claude/GPT/Gemini) |
| `GenerateOptions` | `src/features/content-generator/components/` | 길이/문체 옵션 선택 |
| `GenerateButton` | `src/features/content-generator/components/` | 생성 버튼 + 로딩 상태 |
| `ContentEditor` | `src/components/editor/` | TipTap 기반 WYSIWYG 에디터 |
| `ContentPreview` | `src/features/content-generator/components/` | 생성 결과 미리보기 |
| `SeoScorePanel` | `src/components/seo/` | SEO 점수 대시보드 |
| `SeoScoreBar` | `src/components/seo/` | 개별 점수 프로그레스 바 |
| `CopyButton` | `src/components/ui/` | 클립보드 복사 버튼 |
| `HistoryList` | `src/features/content-generator/components/` | 히스토리 목록 |
| `HistoryCard` | `src/features/content-generator/components/` | 히스토리 카드 아이템 |
| `AuthForm` | `src/components/auth/` | 로그인/회원가입 폼 |

---

## 6. SEO Engine Design (핵심 모듈)

### 6.1 SEO 점수 계산 로직

```typescript
// src/lib/seo/seo-rules.ts — 설정 파일로 분리 (알고리즘 변경 시 여기만 수정)

export const SEO_RULES = {
  title: {
    maxLength: 30,                    // 제목 최대 길이
    keywordRequired: true,            // 메인 키워드 포함 필수
    weight: 0.2,                      // 종합 점수 가중치 20%
  },
  keywordDensity: {
    min: 1.5,                         // 최소 키워드 밀도 (%)
    max: 3.5,                         // 최대 키워드 밀도 (%)
    optimal: 2.5,                     // 최적 키워드 밀도 (%)
    weight: 0.25,                     // 가중치 25%
  },
  structure: {
    minHeadings: 3,                   // 최소 소제목 수
    maxParagraphLength: 5,            // 문단당 최대 문장 수
    weight: 0.2,                      // 가중치 20%
  },
  length: {
    short: { min: 800, max: 1200 },   // 짧은글 기준
    medium: { min: 1800, max: 2500 }, // 중간글 기준
    long: { min: 2800, max: 3500 },   // 긴글 기준
    weight: 0.2,                      // 가중치 20%
  },
  readability: {
    avgSentenceLength: 40,            // 문장 평균 길이 (자)
    weight: 0.15,                     // 가중치 15%
  },
} as const;
```

### 6.2 점수 계산 함수

```typescript
// src/lib/seo/calculate-score.ts

export function calculateSeoScore(params: {
  keyword: string;
  title: string;
  content: string;       // plain text
  contentLength: 'short' | 'medium' | 'long';
}): SeoScore {
  const titleScore = calcTitleScore(params.keyword, params.title);
  const density = calcKeywordDensity(params.keyword, params.content);
  const densityScore = calcDensityScore(density);
  const structureScore = calcStructureScore(params.content);
  const lengthScore = calcLengthScore(params.content, params.contentLength);
  const readabilityScore = calcReadabilityScore(params.content);

  const total = Math.round(
    titleScore * SEO_RULES.title.weight +
    densityScore * SEO_RULES.keywordDensity.weight +
    structureScore * SEO_RULES.structure.weight +
    lengthScore * SEO_RULES.length.weight +
    readabilityScore * SEO_RULES.readability.weight
  );

  const suggestions = generateSuggestions({ titleScore, density, structureScore, lengthScore });

  return { total, title_score: titleScore, keyword_density: density,
           keyword_density_score: densityScore, structure_score: structureScore,
           length_score: lengthScore, readability_score: readabilityScore, suggestions };
}
```

---

## 7. AI Provider Design (Multi-Model)

### 7.1 Provider 패턴

```typescript
// src/lib/ai/types.ts
interface AiProvider {
  generateStream(params: {
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
  }): AsyncIterable<string>;
}

// src/lib/ai/providers/claude-provider.ts
// src/lib/ai/providers/gpt-provider.ts
// src/lib/ai/providers/gemini-provider.ts
```

### 7.2 Provider Router

```typescript
// src/lib/ai/provider-router.ts
import { ClaudeProvider } from './providers/claude-provider';
import { GptProvider } from './providers/gpt-provider';
import { GeminiProvider } from './providers/gemini-provider';

const providers = {
  claude: new ClaudeProvider(),
  gpt: new GptProvider(),
  gemini: new GeminiProvider(),
} as const;

export function getProvider(providerName: AiProviderType): AiProvider {
  const provider = providers[providerName];
  if (!provider) throw new Error(`Unsupported AI provider: ${providerName}`);
  return provider;
}
```

### 7.3 환경 변수 (Provider별)

| Variable | Purpose | Provider |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude API 호출 | Claude |
| `OPENAI_API_KEY` | GPT API 호출 | GPT |
| `GOOGLE_AI_API_KEY` | Gemini API 호출 | Gemini |

### 7.4 Dependencies (Provider별)

| Package | Provider | Purpose |
|---------|----------|---------|
| `@anthropic-ai/sdk` | Claude | Claude API 스트리밍 |
| `openai` | GPT | OpenAI API 스트리밍 |
| `@google/genai` | Gemini | Gemini API 스트리밍 |

---

## 8. AI Prompt Design

> 프롬프트는 모든 AI Provider에 공통으로 적용됩니다. Provider별 미세 조정은 각 Provider 클래스에서 처리합니다.

### 8.1 콘텐츠 생성 System Prompt

```typescript
// src/lib/ai/prompts.ts

export function buildSystemPrompt(options: GenerateOptions): string {
  return `당신은 네이버 블로그 SEO 전문가이자 콘텐츠 작성자입니다.

다음 규칙을 반드시 따라 블로그 글을 작성하세요:

## 네이버 SEO 최적화 규칙
1. 제목: 메인 키워드를 앞부분에 포함, 30자 이내, 클릭 유도
2. 인트로: 200자 이내, 핵심 키워드 자연 포함, 독자의 관심 유도
3. 본문 구조: H2/H3 소제목 3~5개 사용, 각 소제목에 키워드 자연 삽입
4. 키워드 밀도: 본문 대비 2~3% (과하지 않게 자연스럽게)
5. 문단: 3~5문장 단위로 구성, 가독성 확보
6. 아웃트로: 요약 + CTA(댓글/공감 유도)
7. 이미지 가이드: [이미지: 설명] 형태로 이미지 삽입 위치 표시

## 문체 설정
- ${options.tone === 'friendly' ? '친근하고 편안한 말투 (~요, ~죠, ~네요)' : ''}
- ${options.tone === 'professional' ? '전문적이고 신뢰감 있는 말투 (~합니다, ~입니다)' : ''}
- ${options.tone === 'informative' ? '정보 전달 중심의 객관적 말투 (~이다, ~하다)' : ''}

## 글 길이
- ${options.length === 'short' ? '약 1,000자 내외' : ''}
- ${options.length === 'medium' ? '약 2,000자 내외' : ''}
- ${options.length === 'long' ? '약 3,000자 내외' : ''}

## 출력 형식
- 제목은 첫 줄에 # 마크다운으로
- 소제목은 ## 마크다운으로
- 줄바꿈과 문단 구분을 명확히`;
}
```

### 8.2 User Prompt Template

```typescript
export function buildUserPrompt(keyword: string, includeKeywords: string[]): string {
  const subKeywords = includeKeywords.length > 0
    ? `\n포함해야 할 키워드: ${includeKeywords.join(', ')}`
    : '';

  return `"${keyword}" 키워드로 네이버 블로그 상위 노출에 최적화된 글을 작성해주세요.${subKeywords}`;
}
```

---

## 9. Error Handling

### 9.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| `KEYWORD_EMPTY` | 키워드를 입력해주세요 | 빈 키워드 | 입력 필드 포커스 |
| `GENERATION_FAILED` | 콘텐츠 생성에 실패했습니다 | AI API 오류 | 재시도 버튼 표시 |
| `RATE_LIMITED` | 일일 생성 횟수를 초과했습니다 | 횟수 제한 | 남은 시간 안내 |
| `AUTH_REQUIRED` | 로그인이 필요합니다 | 미인증 | 로그인 페이지 이동 |
| `KEYWORD_FETCH_FAILED` | 키워드 추천을 불러올 수 없습니다 | 네이버 API 오류 | 무시 (핵심 기능 아님) |

### 9.2 Error Response Format

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "일일 생성 횟수를 초과했습니다. 6시간 후 다시 시도해주세요.",
    "details": {
      "remaining": 0,
      "resetAt": "2026-02-17T00:00:00Z"
    }
  }
}
```

---

## 10. Security Considerations

- [x] 모든 AI API Key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`)를 서버 사이드에서만 사용
- [x] Supabase RLS로 사용자 본인 데이터만 접근 가능
- [x] 입력값 검증: 키워드 길이 제한 (최대 50자), XSS 방지
- [x] Rate Limiting: 비로그인 3회/일, 로그인 20회/일
- [x] HTTPS 강제 (Vercel 기본 제공)
- [x] Content Security Policy 헤더 설정

---

## 11. Clean Architecture

### 11.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 페이지, UI 컴포넌트, 사용자 인터랙션 | `src/app/`, `src/components/`, `src/features/*/components/` |
| **Application** | 비즈니스 로직 오케스트레이션, 훅 | `src/features/*/hooks/`, `src/stores/` |
| **Domain** | 엔티티 타입, SEO 규칙, 비즈니스 규칙 | `src/types/`, `src/lib/seo/seo-rules.ts` |
| **Infrastructure** | AI API 클라이언트, Supabase, 외부 API | `src/lib/ai/`, `src/lib/supabase/`, `src/app/api/` |

### 11.2 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `KeywordInput`, `GenerateOptions`, `SeoScorePanel` | Presentation | `src/features/*/components/` |
| `useGenerate`, `useSeoScore`, `useKeywords` | Application | `src/features/*/hooks/` |
| `GeneratedContent`, `SeoScore`, `SEO_RULES` | Domain | `src/types/`, `src/lib/seo/` |
| `AiProviderRouter`, `supabaseClient`, `naverKeywordApi` | Infrastructure | `src/lib/` |

---

## 12. Implementation Guide

### 12.1 File Structure (최종)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/
│   │   ├── generate/page.tsx          # 메인 생성 페이지
│   │   └── history/
│   │       ├── page.tsx               # 히스토리 목록
│   │       └── [id]/page.tsx          # 콘텐츠 상세
│   ├── api/
│   │   ├── generate/route.ts          # AI 콘텐츠 생성 API
│   │   ├── keywords/route.ts          # 키워드 추천 API
│   │   ├── seo-score/route.ts         # SEO 점수 API
│   │   └── history/
│   │       ├── route.ts               # 히스토리 CRUD
│   │       └── [id]/route.ts          # 개별 히스토리
│   ├── layout.tsx
│   ├── page.tsx                       # 랜딩/리다이렉트
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Toast.tsx
│   ├── editor/
│   │   └── ContentEditor.tsx          # TipTap 에디터
│   ├── seo/
│   │   ├── SeoScorePanel.tsx          # SEO 점수 패널
│   │   └── SeoScoreBar.tsx            # 개별 점수 바
│   ├── auth/
│   │   └── AuthForm.tsx               # 로그인/회원가입
│   └── layout/
│       ├── Header.tsx
│       └── MobileNav.tsx
├── features/
│   ├── content-generator/
│   │   ├── components/
│   │   │   ├── KeywordInput.tsx        # 키워드 입력
│   │   │   ├── AiModelSelector.tsx    # AI 모델 선택
│   │   │   ├── GenerateOptions.tsx     # 옵션 선택
│   │   │   ├── GenerateButton.tsx      # 생성 버튼
│   │   │   ├── ContentPreview.tsx      # 결과 미리보기
│   │   │   └── CopyButton.tsx          # 복사 버튼
│   │   ├── hooks/
│   │   │   ├── useGenerate.ts          # 생성 로직 훅
│   │   │   └── useHistory.ts           # 히스토리 훅
│   │   └── types.ts
│   ├── keyword-analyzer/
│   │   ├── components/
│   │   │   └── KeywordChips.tsx        # 키워드 칩
│   │   ├── hooks/
│   │   │   └── useKeywords.ts          # 키워드 추천 훅
│   │   └── types.ts
│   └── seo-optimizer/
│       ├── hooks/
│       │   └── useSeoScore.ts          # SEO 점수 훅
│       └── types.ts
├── lib/
│   ├── ai/
│   │   ├── provider-router.ts          # AI Provider 라우터
│   ├── providers/
│   │   ├── claude-provider.ts      # Claude API 클라이언트
│   │   ├── gpt-provider.ts        # GPT API 클라이언트
│   │   └── gemini-provider.ts     # Gemini API 클라이언트
│   ├── types.ts                    # AiProvider 인터페이스
│   │   └── prompts.ts                  # 프롬프트 템플릿
│   ├── seo/
│   │   ├── seo-rules.ts               # SEO 규칙 설정
│   │   └── calculate-score.ts          # 점수 계산 로직
│   └── supabase/
│       ├── client.ts                   # 브라우저 클라이언트
│       └── server.ts                   # 서버 클라이언트
├── stores/
│   └── useGenerateStore.ts             # Zustand 생성 상태 관리
└── types/
    ├── content.ts                      # GeneratedContent, GenerateOptions
    ├── seo.ts                          # SeoScore, SeoRules
    └── keyword.ts                      # KeywordSuggestion
```

### 12.2 Implementation Order

1. [ ] **프로젝트 초기 세팅**: Next.js + Tailwind + TypeScript + ESLint
2. [ ] **Supabase 설정**: 프로젝트 생성, DB 스키마, Auth 설정
3. [ ] **타입 정의**: `src/types/` — 전체 인터페이스 + AiProvider 타입
4. [ ] **SEO 엔진**: `src/lib/seo/` — 규칙 설정 + 점수 계산 로직
5. [ ] **AI Provider**: `src/lib/ai/` — Provider 인터페이스 + Claude/GPT/Gemini 구현 + Router
6. [ ] **API Routes**: `/api/generate`, `/api/keywords`, `/api/seo-score`
7. [ ] **UI 컴포넌트**: 공통 UI → AI 모델 선택기 → SEO 패널 → 에디터
8. [ ] **생성 페이지**: `KeywordInput` → `AiModelSelector` → `GenerateOptions` → `ContentPreview` 통합
9. [ ] **인증 기능**: Supabase Auth 연동 (로그인/회원가입)
10. [ ] **히스토리 기능**: 저장/조회/삭제
11. [ ] **반응형 적용**: 모바일 레이아웃

### 12.3 Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@anthropic-ai/sdk": "latest",
    "openai": "^4",
    "@google/genai": "latest",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "latest",
    "@tiptap/react": "^2",
    "@tiptap/starter-kit": "^2",
    "@tiptap/extension-placeholder": "^2",
    "zustand": "^5",
    "tailwindcss": "^4",
    "sonner": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15"
  }
}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-16 | Initial draft | User |
