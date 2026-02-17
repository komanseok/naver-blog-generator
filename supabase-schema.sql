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

-- RLS 활성화
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;

-- RLS 정책
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

-- Rate Limiting 테이블 (일일 생성 횟수 추적)
CREATE TABLE generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id ON generation_usage(user_id);
CREATE INDEX idx_usage_ip ON generation_usage(ip_address);
CREATE INDEX idx_usage_created_at ON generation_usage(created_at DESC);

ALTER TABLE generation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON generation_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert usage"
  ON generation_usage FOR INSERT
  WITH CHECK (true);
