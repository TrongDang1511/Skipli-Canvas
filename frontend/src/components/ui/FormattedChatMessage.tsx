import { FC, ReactNode } from 'react';
import { Sparkles, Code2 } from 'lucide-react';

interface FormattedChatMessageProps {
  content: string;
}

export const FormattedChatMessage: FC<FormattedChatMessageProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedBlocks: ReactNode[] = [];

  let currentList: { type: 'num' | 'bullet'; items: { num?: string; text: string }[] } | null = null;

  const flushList = (key: string) => {
    if (!currentList || currentList.items.length === 0) return;

    if (currentList.type === 'num') {
      renderedBlocks.push(
        <div key={`${key}-numlist`} className="my-3 space-y-2">
          {currentList.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-amber-400/60 dark:hover:border-[#D4AF37]/50 transition"
            >
              <span className="w-5 h-5 rounded-full bg-[#0B192C] text-[#D4AF37] dark:bg-[#1E3E62] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {item.num || idx + 1}
              </span>
              <div className="flex-1 min-w-0 text-xs text-slate-700 dark:text-stone-300 leading-relaxed">
                {renderInlineFormatted(item.text)}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      renderedBlocks.push(
        <ul key={`${key}-bulletlist`} className="my-2.5 space-y-2 pl-0.5">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-700 dark:text-stone-300"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#D4AF37] shrink-0 mt-1.5 shadow-2xs" />
              <div className="flex-1 min-w-0 leading-relaxed">
                {renderInlineFormatted(item.text)}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    currentList = null;
  };

  // Advanced inline formatter: parses **bold**, *italic*, "quoted tags", (color tags), and `code`
  function renderInlineFormatted(text: string): ReactNode {
    if (!text) return null;

    // Pattern to split by:
    // 1. `code`
    // 2. **bold**
    // 3. *italic*
    // 4. "Quoted Style" or (Parenthesized Color)
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|"[^"]+"|\([^)]+\))/g;
    const tokens = text.split(regex);

    return tokens.map((token, index) => {
      if (!token) return null;

      // 1. Backticks `code`
      if (token.startsWith('`') && token.endsWith('`')) {
        const codeText = token.slice(1, -1);
        return (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md font-mono text-[11px] font-semibold bg-navy-950 dark:bg-slate-950 text-amber-400 border border-amber-500/30 shadow-2xs"
          >
            <Code2 className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{codeText}</span>
          </span>
        );
      }

      // 2. Double Asterisks **bold**
      if (token.startsWith('**') && token.endsWith('**')) {
        const raw = token.slice(2, -2).trim();
        const isTag = /(Warm Hospitality|Modern Luxury|Cyber Tech|Minimalist|Warm Amber|Terracotta|Warm Cream|Cream|Navy Blue|Metallic Gold|Outfit|Playfair|Inter|Plus Jakarta|DM Sans)/i.test(
          raw
        );

        if (isTag) {
          return (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-[#D4AF37] border border-amber-500/30 shadow-2xs"
            >
              {raw}
            </span>
          );
        }

        return (
          <strong key={index} className="font-bold text-[#0B192C] dark:text-white">
            {raw}
          </strong>
        );
      }

      // 3. Single Asterisks *italic* (e.g. *Outfit*, *DM Sans*)
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        const raw = token.slice(1, -1).trim();
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-medium italic text-slate-900 dark:text-stone-200 border border-slate-300/60 dark:border-slate-700 text-[11px]"
          >
            {raw}
          </span>
        );
      }

      // 4. Quoted phrases e.g. "Warm Hospitality" or Parentheses (Terracotta)
      if (
        (token.startsWith('"') && token.endsWith('"') && token.length > 2) ||
        (token.startsWith('(') && token.endsWith(')') && token.length > 2)
      ) {
        const inner = token.slice(1, -1).trim();
        const isStyleOrColor = /(Warm Hospitality|Modern Luxury|Terracotta|Warm Amber|Warm Cream|Cream|Navy Blue|Metallic Gold|Gold|Amber|Outfit|DM Sans|Playfair|Inter|Plus Jakarta)/i.test(
          inner
        );

        if (isStyleOrColor) {
          return (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] border border-amber-500/25 shadow-2xs"
            >
              {token}
            </span>
          );
        }
      }

      return <span key={index}>{token}</span>;
    });
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`empty-${index}`);
      return;
    }

    // 1. Markdown Headers: "### Title" or "## Title"
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList(`heading-${index}`);
      const headerText = headingMatch[2].replace(/\*\*/g, '').trim();
      renderedBlocks.push(
        <div
          key={`h-${index}`}
          className="flex items-center gap-1.5 pt-3.5 pb-1 border-b border-amber-500/30 dark:border-slate-700/80 text-[#0B192C] dark:text-white font-bold text-xs tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37] shrink-0" />
          <span>{headerText}</span>
        </div>
      );
      return;
    }

    // 2. Numbered List item: "1. **Title:** text" or "1) text"
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'num') {
        flushList(`switch-num-${index}`);
        currentList = { type: 'num', items: [] };
      }
      currentList.items.push({ num: numberedMatch[1], text: numberedMatch[2] });
      return;
    }

    // 3. Bullet List item: "- text", "* text", "• text"
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'bullet') {
        flushList(`switch-bullet-${index}`);
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push({ text: bulletMatch[1] });
      return;
    }

    // Flush any pending list
    flushList(`flush-${index}`);

    // 4. Section Headers in Bold text: e.g. "**Ý tưởng thiết kế:**" or "**Gợi ý bước tiếp theo:**"
    const isSectionHeader =
      (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed) && trimmed.length < 90) ||
      /^(ý tưởng thiết kế|gợi ý bước tiếp theo|các phần chính|tính năng|bảng màu|typography|cấu trúc|lưu ý|key sections|features|suggestions|highlights):?$/i.test(
        trimmed.replace(/\*\*/g, '').replace(/:$/, '').trim()
      );

    if (isSectionHeader) {
      const headerText = trimmed.replace(/\*\*/g, '').trim();
      renderedBlocks.push(
        <div
          key={`header-${index}`}
          className="flex items-center gap-1.5 pt-3.5 pb-1 border-b border-amber-500/30 dark:border-slate-700/80 text-[#0B192C] dark:text-[#D4AF37] font-bold text-xs tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37] shrink-0" />
          <span>{headerText}</span>
        </div>
      );
      return;
    }

    // 5. Regular Paragraph
    renderedBlocks.push(
      <p key={`p-${index}`} className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed my-1 select-text">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  });

  flushList('final');

  return <div className="space-y-1 text-xs select-text">{renderedBlocks}</div>;
};
