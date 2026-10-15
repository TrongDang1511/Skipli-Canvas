import { FC, useState, useRef, useEffect } from 'react';
import { FloatingToolbarPosition } from '../../../types/editor.types';
import { LUXURY_TEXT_COLORS, HIGHLIGHT_COLORS } from '../../../utils/text-formatter.utils';
import { cn } from '../../../utils/cn';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Baseline,
  Highlighter,
  Eraser,
} from 'lucide-react';

interface FloatingTextToolbarProps {
  position: FloatingToolbarPosition | null;
  onFormat: (command: string, value?: string) => void;
}

export const FloatingTextToolbar: FC<FloatingTextToolbarProps> = ({
  position,
  onFormat,
}) => {
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Đóng popover khi click ngoài toolbar
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!position || !position.visible) return null;

  const handleAction = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault(); // Ngăn mất selection và con trỏ trong iframe
    onFormat(command, value);
  };

  return (
    <div
      ref={toolbarRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
      className="fixed z-50 flex items-center bg-white dark:bg-[#0B192C] text-slate-800 dark:text-stone-200 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl p-1 gap-0.5 text-xs select-none backdrop-blur-md animate-fadeIn transition-transform duration-100 ring-1 ring-black/5 dark:ring-white/5"
    >
      {/* 1. Nhóm Định Dạng Kiểu Chữ (B, I, U, S) */}
      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'bold')}
        title="In đậm (Ctrl+B)"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <Bold className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'italic')}
        title="In nghiêng (Ctrl+I)"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <Italic className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'underline')}
        title="Gạch chân (Ctrl+U)"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <Underline className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'strikeThrough')}
        title="Gạch ngang chữ"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <Strikethrough className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* 2. Nhóm Căn Lề (Trái, Giữa, Phải) */}
      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'justifyLeft')}
        title="Căn lề trái"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <AlignLeft className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'justifyCenter')}
        title="Căn giữa"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <AlignCenter className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'justifyRight')}
        title="Căn lề phải"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <AlignRight className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* 3. Nhóm Danh Sách (Bullet & Numbered) */}
      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'insertUnorderedList')}
        title="Danh sách dấu chấm (Bullet list)"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <List className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'insertOrderedList')}
        title="Danh sách số thứ tự (Numbered list)"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer text-slate-700 dark:text-stone-200 hover:text-slate-950 dark:hover:text-white"
      >
        <ListOrdered className="w-3.5 h-3.5 stroke-[2]" />
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* 4. Nhóm Màu Chữ & Bút Dạ Quang */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          title="Đổi màu chữ (Bảng màu Luxury)"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer flex items-center gap-0.5"
        >
          <Baseline className="w-3.5 h-3.5 stroke-[2] text-[#D4AF37]" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1.5 p-2 bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl grid grid-cols-3 gap-1.5 z-50 min-w-[105px]">
            {LUXURY_TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onMouseDown={(e) => {
                  handleAction(e, 'foreColor', c.value);
                  setShowColorPicker(false);
                }}
                className={cn('w-6 h-6 rounded-md transition transform hover:scale-110 shadow-xs cursor-pointer', c.previewBg)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          title="Màu dạ quang bôi sáng"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] rounded-md transition cursor-pointer flex items-center gap-0.5"
        >
          <Highlighter className="w-3.5 h-3.5 stroke-[2] text-amber-500" />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1.5 p-2 bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl grid grid-cols-3 gap-1.5 z-50 min-w-[105px]">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onMouseDown={(e) => {
                  handleAction(e, 'hiliteColor', c.value);
                  setShowHighlightPicker(false);
                }}
                className={cn('w-6 h-6 rounded-md transition transform hover:scale-110 shadow-xs cursor-pointer', c.previewBg)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* 5. Gỡ Định Dạng (Clear Format) */}
      <button
        type="button"
        onMouseDown={(e) => handleAction(e, 'removeFormat')}
        title="Gỡ định dạng (Trở về chữ mặc định)"
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1E3E62] text-rose-500 hover:text-rose-600 rounded-md transition cursor-pointer"
      >
        <Eraser className="w-3.5 h-3.5 stroke-[2]" />
      </button>
    </div>
  );
};
