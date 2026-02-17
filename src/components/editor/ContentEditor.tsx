'use client';

import { useRef, useEffect } from 'react';

interface ContentEditorProps {
  content: string;
  onUpdate?: (html: string) => void;
  editable?: boolean;
}

const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

function markdownToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      // 마크다운 소제목
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return '';
      // 이모지 소제목 (홈판형)
      if (emojiRegex.test(line.trim()) && line.trim().length < 40)
        return `<h2>${line}</h2>`;
      // 이미지 플레이스홀더
      if (line.match(/^\[이미지:/))
        return `<p><em>${line}</em></p>`;
      // 해시태그
      if (line.trim().startsWith('#') && line.includes(' #'))
        return `<p class="hashtags">${line}</p>`;
      // 구분선
      if (line.trim().match(/^[-─━=]{3,}$/))
        return '<hr>';
      // 굵게
      const processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // 빈 줄
      if (processed.trim() === '') return '';
      return `<p>${processed}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export function ContentEditor({ content, onUpdate }: ContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = markdownToHtml(content);
      initialized.current = true;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onUpdate?.(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <ToolbarButton onClick={() => execCommand('bold')} label="B" className="font-bold" />
        <ToolbarButton onClick={() => execCommand('italic')} label="I" className="italic" />
        <div className="mx-1 h-4 w-px bg-gray-300" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} label="H2" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} label="H3" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'p')} label="P" />
        <div className="mx-1 h-4 w-px bg-gray-300" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} label="&bull; 목록" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} label="1. 목록" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="prose prose-sm max-w-none focus:outline-none min-h-[300px] p-6 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_p]:my-1 [&_p]:leading-relaxed [&_p]:text-gray-700 [&_.hashtags]:text-blue-500 [&_.hashtags]:mt-4 [&_hr]:my-4 [&_hr]:border-gray-200 [&_em]:text-blue-500 [&_em]:not-italic [&_em]:text-xs"
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  className = '',
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}
