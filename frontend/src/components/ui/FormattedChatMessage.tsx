import { FC, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

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
        <div key={`${key}-numlist`} className="my-2.5 space-y-2">
          {currentList.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 shadow-2xs hover:border-amber-400/40 dark:hover:border-[#D4AF37]/30 transition-all duration-150"
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
        <ul key={`${key}-bulletlist`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-stone-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D4AF37] shrink-0 mt-2" />
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

  // Helper to parse inline styles: bold, colors, italic, code tags
  function renderInlineFormatted(text: string): ReactNode {
    // Regex to split by bold **text** or code `code` or italic *text*
    const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        const rawContent = token.slice(2, -2).trim();
        const cleanName = rawContent.replace(/^["'“”‘’]/, '').replace(/["'“”‘’]$/, '').trim();

        // Check if it represents a design style, color palette, or typography keyword
        const isPaletteOrStyle =
          /^(Warm Hospitality|Modern Luxury|Warm Amber|Terracotta|Warm Cream|Cream|Navy Blue|Metallic Gold|Deep Slate|Emerald Green|Wine Red|Gold|Amber|Outfit|Playfair Display|Inter|Plus Jakarta Sans|Montserrat|Cinzel|Poppins|Roboto|Hero Section|Thực đơn phong phú|Câu chuyện quán|Đặt bàn & Giao hàng|Cảm nhận khách hàng|Menu|Header|Footer|CTA|Feature|Pricing|Testimonial|Contact)$/i.test(
            cleanName
          );

        if (isPaletteOrStyle) {
          return (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-[#D4AF37] border border-amber-500/25 shadow-2xs tracking-wide"
            >
              {rawContent}
            </span>
          );
        }

        return (
          <strong key={index} className="font-bold text-[#0B192C] dark:text-white">
            {rawContent}
          </strong>
        );
      }

      if (token.startsWith('`') && token.endsWith('`')) {
        const codeText = token.slice(1, -1);
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-slate-700"
          >
            {codeText}
          </code>
        );
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

    // 1. Check for Numbered List item: "1. **Title:** text" or "1. text"
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'num') {
        flushList(`switch-num-${index}`);
        currentList = { type: 'num', items: [] };
      }
      currentList.items.push({ num: numberedMatch[1], text: numberedMatch[2] });
      return;
    }

    // 2. Check for Bullet List item: "- text" or "* text"
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'bullet') {
        flushList(`switch-bullet-${index}`);
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push({ text: bulletMatch[1] });
      return;
    }

    // Not a list item, flush any existing list
    flushList(`flush-${index}`);

    // 3. Check for Section Headers: e.g. "**Các phần chính trong trang web bao gồm:**"
    const isSectionHeader =
      (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 80) ||
      /^(các phần|gợi ý|điểm nổi bật|tính năng|thực đơn|cấu trúc|lưu ý):?$/i.test(trimmed.replace(/\*\*/g, '').trim());

    if (isSectionHeader) {
      const headerText = trimmed.replace(/\*\*/g, '').trim();
      renderedBlocks.push(
        <div
          key={`header-${index}`}
          className="flex items-center gap-1.5 pt-3 pb-1 border-b border-slate-200/80 dark:border-slate-800/80 text-[#0B192C] dark:text-white font-bold text-xs tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#D4AF37] shrink-0" />
          <span>{headerText}</span>
        </div>
      );
      return;
    }

    // 4. Regular Paragraph
    renderedBlocks.push(
      <p key={`p-${index}`} className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed my-1 select-text">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  });

  flushList('final');

  return <div className="space-y-1 text-xs select-text">{renderedBlocks}</div>;
};
