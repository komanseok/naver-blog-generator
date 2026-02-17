# 네이버 상위 노출 블로그 콘텐츠 자동 생성 앱 Planning Document

> **Summary**: AI를 활용하여 네이버 검색 상위 노출에 최적화된 블로그 콘텐츠를 자동으로 생성하는 웹 앱
>
> **Project**: blogA
> **Version**: 0.1.0
> **Author**: User
> **Date**: 2026-02-16
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

네이버 블로그 검색 상위 노출을 위한 SEO 최적화 콘텐츠를 AI 기반으로 자동 생성하여, 블로거의 콘텐츠 제작 시간을 대폭 줄이고 검색 노출 효과를 극대화한다.

### 1.2 Background

- 네이버 블로그는 한국 내 주요 트래픽 유입 채널
- 상위 노출을 위해서는 키워드 전략, 글 구조, 문체, 이미지 배치 등 다양한 SEO 요소가 필요
- 수동으로 SEO 최적화 콘텐츠를 작성하는 것은 시간 소모가 큼
- AI를 활용하면 키워드 분석 → 콘텐츠 생성 → SEO 최적화를 자동화할 수 있음

### 1.3 Related Documents

- 참고: 네이버 검색 알고리즘 가이드 (C-Rank, DIA)
- 참고: 네이버 블로그 API 문서

---

## 2. Scope

### 2.1 In Scope

- [ ] 키워드 입력 기반 블로그 콘텐츠 자동 생성
- [ ] 네이버 SEO 최적화 (키워드 밀도, 제목 구조, 소제목 배치)
- [ ] 콘텐츠 미리보기 및 편집 기능
- [ ] 생성된 콘텐츠 히스토리 관리
- [ ] 키워드 관련 연관 키워드 추천
- [ ] 콘텐츠 품질 점수 표시 (SEO 점수)

### 2.2 Out of Scope

- 네이버 블로그 자동 포스팅 (API 제한으로 수동 복사/붙여넣기)
- 이미지 자동 생성 (v2에서 고려)
- 다른 플랫폼(티스토리, 워드프레스) 지원 (v2에서 고려)
- 키워드 순위 추적 대시보드

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 키워드 입력 시 네이버 SEO 최적화 블로그 글 자동 생성 | High | Pending |
| FR-02 | 생성 시 글 길이(짧은글/중간/긴글), 문체(친근/전문/정보) 옵션 선택 | High | Pending |
| FR-03 | 네이버 SEO 점수 실시간 표시 (키워드 밀도, 제목 적합성, 구조 점수) | High | Pending |
| FR-04 | 연관 키워드 자동 추천 (네이버 자동완성/연관검색어 기반) | Medium | Pending |
| FR-05 | 생성된 콘텐츠 편집기 (WYSIWYG) | Medium | Pending |
| FR-06 | 콘텐츠 생성 히스토리 저장 및 조회 | Medium | Pending |
| FR-07 | 클립보드 복사 (네이버 블로그 에디터에 바로 붙여넣기) | High | Pending |
| FR-08 | 사용자 회원가입/로그인 | Medium | Pending |
| FR-09 | 소제목(H2, H3) 자동 구성 및 키워드 자연 삽입 | High | Pending |
| FR-10 | 인트로/아웃트로 자동 생성 (CTA 포함) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 콘텐츠 생성 응답 시간 < 15초 | API 응답 시간 측정 |
| Performance | 페이지 로드 < 2초 | Lighthouse |
| Security | API Key 서버 사이드 관리 | 코드 리뷰 |
| UX | 모바일 반응형 지원 | 디바이스 테스트 |
| Reliability | 생성 실패 시 재시도 + 에러 안내 | E2E 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 키워드 입력 → 블로그 콘텐츠 생성 플로우 동작
- [ ] SEO 점수 표시 기능 동작
- [ ] 생성/편집/복사 전체 사용자 플로우 완성
- [ ] 회원가입/로그인 동작
- [ ] 모바일 반응형 적용

### 4.2 Quality Criteria

- [ ] TypeScript strict mode
- [ ] Zero lint errors
- [ ] Build 성공
- [ ] 주요 플로우 수동 테스트 완료

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI API 비용 증가 | High | Medium | 토큰 사용량 제한, 캐싱 전략, 요금제별 사용량 관리 |
| 네이버 SEO 알고리즘 변경 | Medium | Medium | SEO 규칙을 설정 파일로 분리하여 빠른 업데이트 가능 |
| AI 생성 콘텐츠 품질 불일치 | High | Medium | 프롬프트 엔지니어링 고도화, 사용자 피드백 루프 |
| 네이버 연관검색어 크롤링 제한 | Medium | High | 공개 API 우선 사용, 대안 키워드 DB 구축 |
| AI 생성 글의 네이버 저품질 판정 | High | Medium | 자연스러운 문체 생성, 중복 방지, 사용자 편집 유도 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js (App Router)** | SSR/SSG 지원, API Routes 활용, SEO 유리 |
| State Management | Context / Zustand / Redux | **Zustand** | 경량, 간단한 API, 콘텐츠 생성 상태 관리에 적합 |
| AI API | OpenAI / Claude / Gemini | **Multi-AI (Claude + GPT + Gemini)** | 사용자 선택형, Provider 패턴으로 확장 용이 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS** | 빠른 UI 개발, 반응형 유틸리티 |
| Rich Text Editor | TipTap / Slate / Quill | **TipTap** | 확장성, 커스텀 용이, 네이버 블로그 포맷 호환 |
| Backend | BaaS / Custom Server | **Next.js API Routes + DB** | AI API 프록시, 히스토리 저장 |
| Database | Supabase / PlanetScale / SQLite | **Supabase (PostgreSQL)** | 무료 티어, Auth 내장, 실시간 지원 |
| Auth | NextAuth / Supabase Auth | **Supabase Auth** | DB와 통합, 소셜 로그인 지원 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure Preview:
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/                   # 메인 앱 페이지
│   │   ├── generate/             # 콘텐츠 생성 페이지
│   │   ├── history/              # 히스토리 페이지
│   │   └── dashboard/            # 대시보드
│   ├── api/                      # API Routes
│   │   ├── generate/             # AI 콘텐츠 생성 API
│   │   ├── keywords/             # 키워드 추천 API
│   │   └── seo-score/            # SEO 점수 계산 API
│   └── layout.tsx
├── components/                   # 공통 컴포넌트
│   ├── ui/                       # 기본 UI 컴포넌트
│   ├── editor/                   # 에디터 관련 컴포넌트
│   └── seo/                      # SEO 점수 표시 컴포넌트
├── features/                     # 기능별 모듈
│   ├── content-generator/        # 콘텐츠 생성 기능
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── keyword-analyzer/         # 키워드 분석 기능
│   └── seo-optimizer/            # SEO 최적화 기능
├── lib/                          # 유틸리티
│   ├── ai/                       # AI API 클라이언트
│   ├── seo/                      # SEO 규칙 엔진
│   └── supabase/                 # Supabase 클라이언트
├── stores/                       # Zustand 스토어
└── types/                        # 공통 타입
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [ ] ESLint configuration
- [ ] Prettier configuration
- [ ] TypeScript configuration

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | Missing | 컴포넌트: PascalCase, 함수: camelCase, 파일: kebab-case | High |
| **Folder structure** | Missing | Feature-based 모듈 구조 | High |
| **Import order** | Missing | 외부 → 내부 → 타입 순서 | Medium |
| **Environment variables** | Missing | AI API Key, Supabase 설정 | High |
| **Error handling** | Missing | try-catch + toast 알림 패턴 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `ANTHROPIC_API_KEY` | Claude AI API 호출 | Server | ☑ |
| `OPENAI_API_KEY` | GPT AI API 호출 | Server | ☑ |
| `GOOGLE_AI_API_KEY` | Gemini AI API 호출 | Server | ☑ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | ☑ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Client | ☑ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 | Server | ☑ |

---

## 8. Core Feature Flow

### 8.1 콘텐츠 생성 플로우

```
[사용자 키워드 입력]
       ↓
[연관 키워드 추천] ← 네이버 자동완성/연관검색어
       ↓
[옵션 선택] (길이, 문체, 포함 키워드)
       ↓
[AI 콘텐츠 생성] ← 선택된 AI (Claude / GPT / Gemini)
       ↓
[SEO 점수 분석] ← 키워드 밀도, 구조, 제목 체크
       ↓
[콘텐츠 미리보기 + 편집]
       ↓
[클립보드 복사 / 히스토리 저장]
```

### 8.2 네이버 SEO 최적화 규칙 (핵심)

| 항목 | 최적화 전략 |
|------|------------|
| 제목 | 메인 키워드 포함, 30자 이내, 궁금증 유발 |
| 본문 길이 | 최소 1,500자 이상 (2,000~3,000자 권장) |
| 키워드 밀도 | 본문 대비 2~3% (과다 사용 금지) |
| 소제목 | H2/H3 활용, 키워드 자연 포함 |
| 인트로 | 200자 이내, 핵심 키워드 포함 |
| 아웃트로 | CTA 포함, 관련 글 유도 |
| 문단 구성 | 3~5문장 단위, 가독성 확보 |
| 이미지 가이드 | 본문 내 이미지 삽입 위치 안내 (alt 태그 가이드) |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design naver-blog-content-generator`)
2. [ ] 기술 스택 세팅 (Next.js + Tailwind + Supabase)
3. [ ] AI 프롬프트 엔지니어링 (네이버 SEO 최적화 프롬프트)
4. [ ] UI/UX 목업 설계
5. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-16 | Initial draft | User |
