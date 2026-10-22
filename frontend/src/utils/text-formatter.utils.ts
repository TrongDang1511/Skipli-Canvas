import { TextColorOption, FloatingToolbarPosition } from '../types/editor.types';

export const LUXURY_TEXT_COLORS: TextColorOption[] = [
  { label: 'Deep Navy', value: '#0B192C', previewBg: 'bg-[#0B192C]' },
  { label: 'Metallic Gold', value: '#D4AF37', previewBg: 'bg-[#D4AF37]' },
  { label: 'Slate Gray', value: '#475569', previewBg: 'bg-slate-600' },
  { label: 'Crimson Red', value: '#E11D48', previewBg: 'bg-rose-600' },
  { label: 'Emerald Green', value: '#059669', previewBg: 'bg-emerald-600' },
  { label: 'Pure White', value: '#FFFFFF', previewBg: 'bg-white border border-slate-300' },
];

export const HIGHLIGHT_COLORS: TextColorOption[] = [
  { label: 'Sunny Yellow', value: '#FEF08A', previewBg: 'bg-yellow-200' },
  { label: 'Soft Mint', value: '#CCFBF1', previewBg: 'bg-teal-100' },
  { label: 'Peach Cream', value: '#FFEDD5', previewBg: 'bg-orange-100' },
  { label: 'Blush Pink', value: '#FCE7F3', previewBg: 'bg-pink-100' },
  { label: 'None', value: 'transparent', previewBg: 'bg-transparent border border-dashed border-slate-400' },
];

/**
 * Tính toán tọa độ vị trí hiển thị thanh công cụ nổi ngay phía trên đoạn văn bản đang bôi đen
 */
export function calculateSelectionPosition(
  iframeEl: HTMLIFrameElement | null
): FloatingToolbarPosition | null {
  if (!iframeEl) return null;

  try {
    const iframeWin = iframeEl.contentWindow;
    if (!iframeWin) return null;

    const selection = iframeWin.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    const iframeRect = iframeEl.getBoundingClientRect();

    // Nếu vùng chọn không có kích thước thực tế
    if (rangeRect.width === 0 && rangeRect.height === 0) {
      return null;
    }

    // Tọa độ tính theo viewport cửa sổ chính (Fixed Positioning)
    let top = iframeRect.top + rangeRect.top - 50;
    // Nếu quá sát mép trên, hiển thị phía dưới đoạn bôi đen
    if (top < 50) {
      top = iframeRect.top + rangeRect.bottom + 12;
    }

    const left = iframeRect.left + rangeRect.left + rangeRect.width / 2;

    return {
      top: Math.max(10, Math.round(top)),
      left: Math.max(10, Math.round(left)),
      visible: true,
    };
  } catch {
    return null;
  }
}

/**
 * Thực thi lệnh định dạng tài liệu trên iframe document
 */
export function executeFormatCommand(
  doc: Document | null,
  command: string,
  value: string | undefined = undefined
) {
  if (!doc) return;
  try {
    if (command === 'hiliteColor') {
      // Hỗ trợ cả hiliteColor và backColor tùy theo trình duyệt
      try {
        doc.execCommand('hiliteColor', false, value);
      } catch {
        doc.execCommand('backColor', false, value);
      }
    } else {
      doc.execCommand(command, false, value);
    }
  } catch (err) {
    console.error(`[TextFormatter] Failed to execute formatting command ${command}:`, err);
  }
}
