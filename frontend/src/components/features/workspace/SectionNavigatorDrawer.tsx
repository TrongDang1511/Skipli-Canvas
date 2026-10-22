import { FC, useState } from 'react';
import { SectionItemInfo } from '../../../types/editor.types';
import { cn } from '../../../utils/cn';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Compass,
  CornerDownRight,
} from 'lucide-react';

interface SectionNavigatorDrawerProps {
  isOpen: boolean;
  sections: SectionItemInfo[];
  onClose: () => void;
  onMoveSection: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (index: number) => void;
  onSelectSection: (element: HTMLElement) => void;
}

export const SectionNavigatorDrawer: FC<SectionNavigatorDrawerProps> = ({
  isOpen,
  sections,
  onClose,
  onMoveSection,
  onToggleVisibility,
  onSelectSection,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onMoveSection(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <aside className="w-72 bg-white dark:bg-[#0B192C] border border-slate-200/90 dark:border-slate-800/80 rounded-xl flex flex-col h-full shadow-md z-30 transition-colors select-none animate-fadeIn shrink-0 overflow-hidden">
      {/* Header Drawer */}
      <div className="h-12 px-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 stroke-[2] text-[#D4AF37]" />
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Section Navigator
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-stone-400">
              {sections.length} sections
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Danh sách Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Compass className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600 mb-2" />
            <span className="text-xs font-semibold">No sections detected</span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Reload page or generate a new layout to synchronize
            </span>
          </div>
        ) : (
          sections.map((sec, index) => {
            const isFirst = index === 0;
            const isLast = index === sections.length - 1;

            return (
              <div
                key={sec.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'group flex items-center gap-1.5 p-2 rounded-xl border transition cursor-grab active:cursor-grabbing',
                  draggedIndex === index
                    ? 'opacity-40 border-dashed border-[#D4AF37] bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-[#112240]/40 hover:bg-white dark:hover:bg-[#1E3E62]/60 hover:border-slate-300 dark:hover:border-slate-700',
                  sec.isHidden && 'opacity-50 bg-slate-100/50 dark:bg-slate-900/50'
                )}
              >
                {/* Tay Cầm Kéo Thả */}
                <div className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white cursor-grab p-0.5">
                  <GripVertical className="w-3.5 h-3.5 stroke-[2]" />
                </div>

                {/* Tên Section & Click để cuộn tới */}
                <div
                  onClick={() => onSelectSection(sec.element)}
                  className="flex-1 min-w-0 cursor-pointer"
                  title="Click to scroll to this section"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-stone-200 truncate group-hover:text-amber-600 dark:group-hover:text-[#D4AF37] transition">
                      {sec.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-stone-400">
                    <span className="uppercase font-mono font-medium text-[9px] bg-slate-200/70 dark:bg-slate-700 px-1 rounded">
                      {sec.tag}
                    </span>
                    <span>Position #{index + 1}</span>
                  </div>
                </div>

                {/* Các Nút Hành Động Nhanh */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Nút Lên */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFirst) onMoveSection(index, index - 1);
                    }}
                    disabled={isFirst}
                    title="Move up"
                    className="p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white rounded transition disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-3.5 h-3.5 stroke-[2]" />
                  </button>

                  {/* Nút Xuống */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLast) onMoveSection(index, index + 1);
                    }}
                    disabled={isLast}
                    title="Move down"
                    className="p-1 text-slate-400 hover:text-navy-900 dark:hover:text-white rounded transition disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
                  </button>

                  {/* Nút Ẩn/Hiện */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(index);
                    }}
                    title={sec.isHidden ? 'Show section' : 'Hide section'}
                    className={cn(
                      'p-1 rounded transition cursor-pointer',
                      sec.isHidden
                        ? 'text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                    )}
                  >
                    {sec.isHidden ? (
                      <EyeOff className="w-3.5 h-3.5 stroke-[2]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Gợi Ý */}
      <div className="p-3 border-t border-slate-200/90 dark:border-slate-800 text-[11px] text-slate-500 dark:text-stone-400 flex items-center gap-1.5 bg-slate-50/50 dark:bg-[#070F1E]">
        <CornerDownRight className="w-3.5 h-3.5 stroke-[2] text-[#D4AF37] shrink-0" />
        <span>Drag cards or use arrows to reorder layout sections.</span>
      </div>
    </aside>
  );
};
