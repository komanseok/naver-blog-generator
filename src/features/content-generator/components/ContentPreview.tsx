'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useGenerateStore } from '@/stores/useGenerateStore';
import { calculateSeoScore } from '@/lib/seo/calculate-score';
import { saveToHistory } from '@/lib/history/storage';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const ContentEditor = dynamic(
  () => import('@/components/editor/ContentEditor').then((mod) => mod.ContentEditor),
  { ssr: false, loading: () => <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white"><p className="text-sm text-gray-400">에디터 로딩 중...</p></div> },
);

export function ContentPreview() {
  const { title, content, isGenerating, keyword, options, seoScore, setContent, setSeoScore, setTitle } =
    useGenerateStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  // 콘텐츠 변경(재생성) 시 저장 상태 리셋
  useEffect(() => {
    setIsSaved(false);
  }, [content]);

  const handleEditorUpdate = useCallback(
    (html: string) => {
      setEditedHtml(html);
      setIsSaved(false);
      const plainText = html.replace(/<[^>]*>/g, '');
      const score = calculateSeoScore({
        keyword,
        title,
        content: plainText,
        contentLength: options.length,
      });
      setSeoScore(score);
    },
    [keyword, title, options.length, setSeoScore],
  );

  const handleToggleEdit = () => {
    if (isEditing) {
      setContent(editedHtml);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = isEditing
        ? editedHtml.replace(/<[^>]*>/g, '')
        : content.replace(/<[^>]*>/g, '').replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/\[이미지:\s*([^\]]+)\]/g, '\n[$1 이미지]\n');
      await navigator.clipboard.writeText(textToCopy);
      toast.success('클립보드에 복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  const handleCopyHtml = async () => {
    const baseStyle = 'font-family: "Noto Sans KR", "맑은 고딕", "Malgun Gothic", sans-serif; color: #333;';
    const pStyle = `${baseStyle} font-size: 16px; line-height: 1.8; margin: 0 0 12px 0;`;
    const h2Style = `${baseStyle} font-size: 22px; font-weight: 700; line-height: 1.5; margin: 28px 0 12px 0;`;
    const h3Style = `${baseStyle} font-size: 18px; font-weight: 700; line-height: 1.5; margin: 20px 0 8px 0;`;

    try {
      let html: string;
      if (isEditing) {
        // 에디터 HTML에도 인라인 스타일 주입
        html = editedHtml
          .replace(/<p(?=[\s>])/g, `<p style="${pStyle}"`)
          .replace(/<h2(?=[\s>])/g, `<h2 style="${h2Style}"`)
          .replace(/<h3(?=[\s>])/g, `<h3 style="${h3Style}"`)
          .replace(/<b>/g, `<b style="font-weight: 700;">`)
          .replace(/<strong>/g, `<strong style="font-weight: 700;">`);
      } else if (/<[a-z][\s\S]*>/i.test(content)) {
        // content가 HTML인 경우 (에디터에서 편집 후 저장된 경우)
        html = content
          .replace(/<p(?=[\s>])/g, `<p style="${pStyle}"`)
          .replace(/<h2(?=[\s>])/g, `<h2 style="${h2Style}"`)
          .replace(/<h3(?=[\s>])/g, `<h3 style="${h3Style}"`)
          .replace(/<b>/g, `<b style="font-weight: 700;">`)
          .replace(/<strong>/g, `<strong style="font-weight: 700;">`);
      } else {
        const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
        html = content
          .replace(/^### (.+)$/gm, `<h3 style="${h3Style}">$1</h3>`)
          .replace(/^## (.+)$/gm, `<h2 style="${h2Style}">$1</h2>`)
          .replace(/^# (.+)$/gm, '')
          .replace(/\*\*(.+?)\*\*/g, '<b style="font-weight: 700;">$1</b>')
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => {
            if (line.startsWith('<h2') || line.startsWith('<h3')) return line;
            if (emojiRegex.test(line.trim()) && line.trim().length < 40)
              return `<h2 style="${h2Style}">${line}</h2>`;
            if (line.trim().startsWith('#') && line.includes(' #'))
              return `<p style="${pStyle} color: #3b82f6;">${line}</p>`;
            if (line.trim().match(/^[-─━=]{3,}$/))
              return '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">';
            return `<p style="${pStyle}">${line}</p>`;
          })
          .join('\n');
      }

      const wrapped = `<div style="${baseStyle}">${html}</div>`;

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([wrapped], { type: 'text/html' }),
          'text/plain': new Blob([content], { type: 'text/plain' }),
        }),
      ]);
      toast.success('HTML 형식으로 복사되었습니다 (네이버 블로그에 바로 붙여넣기 가능)');
    } catch {
      handleCopy();
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      if (!title || !content) {
        toast.error('저장할 콘텐츠가 없습니다');
        return;
      }
      setIsSaving(true);
      await saveToHistory({
        keyword,
        sub_keywords: options.include_keywords,
        title,
        content: isEditing ? editedHtml : content,
        content_text: isEditing
          ? editedHtml.replace(/<[^>]*>/g, '')
          : content.replace(/<[^>]*>/g, '').replace(/^#+\s*/gm, '').replace(/\*\*/g, ''),
        options,
        seo_score: seoScore ?? {
          total: 0,
          title_score: 0,
          keyword_density: 0,
          keyword_density_score: 0,
          structure_score: 0,
          length_score: 0,
          readability_score: 0,
          suggestions: [],
        },
        is_edited: isEditing,
      });
      setIsSaved(true);
      toast.success('히스토리에 저장되었습니다');
    } catch (e) {
      console.error('Save error:', e);
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (!content && !isGenerating) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-400">키워드를 입력하고 생성 버튼을 눌러주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <h2 className="flex-1 text-xl font-bold text-gray-900">{title}</h2>
          )}
        </div>
      )}

      {isEditing && !isGenerating ? (
        <ContentEditor content={content} onUpdate={handleEditorUpdate} editable={true} />
      ) : (
        <div className="prose prose-sm max-w-none rounded-xl border border-gray-200 bg-white p-6">
          {/<[a-z][\s\S]*>/i.test(content) ? (
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="[&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_p]:my-1 [&_p]:leading-relaxed [&_p]:text-gray-700 [&_.hashtags]:text-blue-500 [&_.hashtags]:mt-4 [&_hr]:my-4 [&_hr]:border-gray-200 [&_em]:text-blue-500 [&_em]:not-italic [&_em]:text-xs"
            />
          ) : (
            content.split('\n').map((line, i) => {
              // 마크다운 소제목 (기존 호환)
              if (line.startsWith('### '))
                return (
                  <h3 key={i} className="mt-4 text-base font-bold text-gray-900">
                    {line.slice(4)}
                  </h3>
                );
              if (line.startsWith('## '))
                return (
                  <h2 key={i} className="mt-6 text-lg font-bold text-gray-900">
                    {line.slice(3)}
                  </h2>
                );
              if (line.startsWith('# ')) return null;
              // 이모지로 시작하는 소제목 (홈판형)
              if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(line.trim()) && line.trim().length < 40)
                return (
                  <h2 key={i} className="mt-6 text-lg font-bold text-gray-900">
                    {line}
                  </h2>
                );
              // 이미지 플레이스홀더
              if (line.match(/^\[이미지:/))
                return (
                  <div
                    key={i}
                    className="my-3 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-3 text-center text-xs text-blue-500"
                  >
                    {line}
                  </div>
                );
              // 해시태그 라인
              if (line.trim().startsWith('#') && line.includes(' #'))
                return (
                  <p key={i} className="mt-4 text-sm leading-relaxed text-blue-500">
                    {line}
                  </p>
                );
              // 구분선
              if (line.trim().match(/^[-─━=]{3,}$/))
                return <hr key={i} className="my-4 border-gray-200" />;
              if (line.trim() === '') return <br key={i} />;
              return (
                <p key={i} className="my-1 leading-relaxed text-gray-700">
                  {line}
                </p>
              );
            })
          )}
          {isGenerating && <span className="inline-block h-4 w-1 animate-pulse bg-blue-500" />}
        </div>
      )}

      {content && !isGenerating && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            HTML 복사 (블로그 붙여넣기)
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            텍스트 복사
          </button>
          <button
            type="button"
            onClick={handleToggleEdit}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              isEditing
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isEditing ? '편집 완료' : '편집'}
          </button>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                isSaved
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              }`}
            >
              {isSaving ? '저장 중...' : isSaved ? '저장됨' : '저장'}
            </button>
          ) : (
            <Link
              href="/login?redirect=/generate"
              className="rounded-lg bg-gray-300 px-4 py-2.5 text-center text-xs font-medium text-gray-500 transition hover:bg-gray-400 hover:text-white"
            >
              로그인 후 저장
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
