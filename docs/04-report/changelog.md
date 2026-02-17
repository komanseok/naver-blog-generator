# Changelog

All notable changes to the blogA project are documented here.

## [1.0.0] - 2026-02-17

### Added
- AI 기반 네이버 블로그 콘텐츠 자동 생성 기능 (SSE 스트리밍)
- 네이버 SEO 점수 계산 엔진 (5가지 메트릭: 제목, 키워드 밀도, 구조, 길이, 가독성)
- 연관 키워드 자동 추천 (Naver 자동완성 API 연동)
- contentEditable 기반 WYSIWYG 에디터 (커스텀 툴바: 굵게, 기울임, 제목, 리스트)
- 콘텐츠 히스토리 관리 (저장, 조회, 삭제, 상세보기, 무한 스크롤)
- 3가지 AI 제공자 지원 (Claude Sonnet 4.5, GPT-4.1 Mini, Gemini 2.5 Flash) + Mock 제공자
- Google + Kakao OAuth 소셜 로그인
- Rate Limiting (게스트 3회/일, 로그인 사용자 20회/일)
- 일일 사용량 표시 (진행 바)
- 모바일 완전 반응형 UI (hamburger 메뉴)
- HTML/Markdown 듀얼 포맷 미리보기 렌더링
- 네이버 블로그 호환 HTML 클립보드 복사 (인라인 폰트 스타일)
- 토큰 고갈 시 자동 모델 전환 UI
- 동일 키워드 캐싱 (API 비용 절감)
- Supabase 통합 (Auth, DB, RLS)

### Changed
- TipTap v3 → contentEditable 에디터 (Next.js 16 SSR 호환성 개선)
- 분리된 API 라우트 → Supabase 클라이언트 직접 호출 (빠른 프로토타입)
- gpt-4o → gpt-4.1-mini (최신 모델, 비용 최적화)
- gemini-2.0-flash → gemini-2.5-flash (최신 버전)
- 기본 SEO 규칙 → 네이버 블로그 알고리즘 최적화 프롬프트 (프로덕션급)

### Fixed
- TipTap v3 SSR 호환성 문제
- localStorage 폴백으로 오프라인 기능 지원
- API 키 보안 (모든 API 키를 서버측 환경변수에서만 관리)

### Security
- 모든 AI API Key 서버측 관리
- Supabase RLS 정책 적용
- 입력 검증 (키워드 50자 제한)
- XSS 방지 (React 자동 escape, contentEditable sanitize)
- Rate Limiting으로 API 남용 방지

### Documentation
- PDCA Plan 문서 완성
- PDCA Design 문서 완성
- PDCA Analysis 보고서 (92% 일치율)
- PDCA Completion Report 작성

### Deployment
- Vercel에 프로덕션 배포
- 자동 HTTPS (SSL/TLS)
- GitHub Actions 자동 배포 설정
- 환경변수 관리 (Vercel CLI)

---

## [0.1.0] - 2026-02-16

### Initial
- 프로젝트 초기화
- 계획 문서 작성
- 설계 문서 작성
- 기술 스택 선정 (Next.js 16, React 19, Tailwind 4, Zustand, Supabase)

---

## Unreleased (계획 중)

### Planned for v1.1
- 이미지 자동 생성 기능
- 히스토리 고급 필터 (카테고리, 태그)
- SEO 계산 캐싱 (성능 최적화)
- E2E 테스트 (Playwright)
- .env.example 템플릿

### Planned for v1.2
- 다양한 플랫폼 지원 (티스토리, 워드프레스)
- 키워드 순위 추적 대시보드
- SEO 심화 분석 (백링크, 경쟁사 분석)

### Planned for v2.0
- 팀 협업 기능
- 콘텐츠 버전 관리
- A/B 테스트 기능
- 고급 분석 대시보드

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes, significant feature additions
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, minor improvements

