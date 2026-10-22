import { FC } from 'react';
import { CardSiblingInfo } from '../../../types/editor.types';
import { ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';

interface CardReorderControlsProps {
  cardInfo: CardSiblingInfo | null;
  onMovePrev: () => void;
  onMoveNext: () => void;
}

export const CardReorderControls: FC<CardReorderControlsProps> = ({
  cardInfo,
  onMovePrev,
  onMoveNext,
}) => {
  if (!cardInfo) return null;

  return (
    <div
      style={{
        top: `${cardInfo.rect.top}px`,
        left: `${cardInfo.rect.left}px`,
      }}
      className="fixed z-40 flex items-center bg-[#0B192C] text-[#D4AF37] dark:bg-[#1E3E62] dark:text-white border border-[#D4AF37]/60 rounded-lg shadow-xl px-1 py-0.5 gap-0.5 text-xs select-none backdrop-blur-xs animate-fadeIn"
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onMovePrev}
        disabled={!cardInfo.canMovePrev}
        title="Move card backward"
        className="p-1 hover:bg-white/10 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[#D4AF37] dark:text-white"
      >
        <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <div className="px-0.5 text-slate-400">
        <GripHorizontal className="w-3 h-3 stroke-[2]" />
      </div>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onMoveNext}
        disabled={!cardInfo.canMoveNext}
        title="Move card forward"
        className="p-1 hover:bg-white/10 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[#D4AF37] dark:text-white"
      >
        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
};
