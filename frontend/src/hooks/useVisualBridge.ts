import { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import {
  CanvasEditorMode,
  FloatingToolbarPosition,
  ImageTargetInfo,
  SectionItemInfo,
  CardSiblingInfo,
} from '../types/editor.types';
import { getElementTagLabel, cleanInspectorArtifacts } from '../utils/dom-inspector.utils';
import { calculateSelectionPosition, executeFormatCommand } from '../utils/text-formatter.utils';
import { isImageTarget, extractImageSource, applyImageToElement } from '../utils/image-replacer.utils';
import {
  scanSections,
  moveSectionInDOM,
  toggleSectionVisibilityInDOM,
  detectCardSibling,
  moveCardSiblingInDOM,
} from '../utils/section-navigator.utils';
import { HistoryManager, getCleanBodySnapshot } from '../utils/history-manager.utils';

interface UseVisualBridgeOptions {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  initialHtml?: string;
  onSaveHtml?: (cleanHtml: string) => Promise<void>;
}

const TEXT_TAGS_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, span, a, button, li, blockquote, b, strong, i, em, label, td, th';

/**
 * Tạo CSS Selector phân cấp duy nhất cho bất kỳ phần tử DOM nào trong Iframe
 */
function getDomPath(el: HTMLElement | null): string | undefined {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return undefined;
  const path: string[] = [];
  let curr: HTMLElement | null = el;

  while (curr && curr.tagName && curr.tagName.toLowerCase() !== 'body' && curr.tagName.toLowerCase() !== 'html') {
    let selector = curr.tagName.toLowerCase();
    if (curr.id) {
      const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(curr.id) : curr.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
      selector += `#${escapedId}`;
      path.unshift(selector);
      break;
    }
    let siblingIndex = 1;
    let sibling = curr.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === curr.tagName) siblingIndex++;
      sibling = sibling.previousElementSibling;
    }
    selector += `:nth-of-type(${siblingIndex})`;
    path.unshift(selector);
    curr = curr.parentElement;
  }
  return path.length > 0 ? path.join(' > ') : undefined;
}

export function useVisualBridge({
  iframeRef,
  initialHtml,
  onSaveHtml,
}: UseVisualBridgeOptions) {
  const [mode, setMode] = useState<CanvasEditorMode>('preview');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedElement, _setSelectedElement] = useState<HTMLElement | null>(null);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const setSelectedElement = useCallback((el: HTMLElement | null) => {
    selectedElementRef.current = el;
    _setSelectedElement(el);
  }, []);

  // Trạng thái Text Editing & Floating Toolbar
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [activeEditingElement, setActiveEditingElement] = useState<HTMLElement | null>(null);
  const [selectionPos, setSelectionPos] = useState<FloatingToolbarPosition | null>(null);

  // Trạng thái Image Replacer
  const [imageTarget, setImageTarget] = useState<ImageTargetInfo | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  // Trạng thái Drag & Drop Sections và Cards
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState<boolean>(false);
  const [sectionsList, setSectionsList] = useState<SectionItemInfo[]>([]);
  const [cardSiblingInfo, setCardSiblingInfo] = useState<CardSiblingInfo | null>(null);

  // Quản lý Lịch sử thao tác (Undo / Redo)
  const historyManager = useRef<HistoryManager>(new HistoryManager(20));
  const preEditTextSnapshotRef = useRef<string | null>(null);
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0,
    lastUndoLabel: null as string | null,
    lastRedoLabel: null as string | null,
  });

  const syncHistoryState = useCallback(() => {
    const hm = historyManager.current;
    setHistoryState({
      canUndo: hm.canUndo,
      canRedo: hm.canRedo,
      undoCount: hm.undoCount,
      redoCount: hm.redoCount,
      lastUndoLabel: hm.lastUndoLabel,
      lastRedoLabel: hm.lastRedoLabel,
    });
  }, []);

  const captureSnapshot = useCallback((label: string, targetEl?: HTMLElement | null) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const snapshot = getCleanBodySnapshot(doc);
    if (snapshot) {
      const targetSelector = getDomPath(targetEl || null);
      const scrollTop = doc.documentElement.scrollTop || doc.body?.scrollTop || 0;
      historyManager.current.pushSnapshot(snapshot, label, targetSelector, scrollTop);
      syncHistoryState();
    }
  }, [iframeRef, syncHistoryState]);

  // Reset sạch lịch sử khi nạp mã HTML mới (ví dụ AI tạo giao diện mới)
  useEffect(() => {
    historyManager.current.reset();
    syncHistoryState();
  }, [initialHtml, syncHistoryState]);

  // Helper truy cập contentDocument an toàn từ iframe
  const getIframeDoc = useCallback((): Document | null => {
    try {
      return iframeRef.current?.contentDocument || null;
    } catch {
      return null;
    }
  }, [iframeRef]);

  // Quét danh sách Sections hiện tại
  const refreshSections = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return;
    const scanned = scanSections(doc);
    setSectionsList(scanned);
  }, [getIframeDoc]);

  // Inject CSS styles cho Inspector & Text Editing vào Iframe
  const injectInspectorStyles = useCallback((doc: Document) => {
    let style = doc.getElementById('skipli-inspector-styles') as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement('style');
      style.id = 'skipli-inspector-styles';
      (doc.head || doc.body)?.appendChild(style);
    }
    style.textContent = `
      .skipli-hovered {
        outline: 2px dashed #D4AF37 !important;
        outline-offset: -2px !important;
        cursor: pointer !important;
      }
      .skipli-selected {
        outline: 2px solid #0B192C !important;
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.45) !important;
        outline-offset: -2px !important;
      }
      .skipli-text-editing {
        outline: 2px solid #D4AF37 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.25) !important;
        cursor: text !important;
        background-color: rgba(212, 175, 55, 0.04) !important;
      }
      #skipli-inspector-badge {
        position: absolute;
        z-index: 9999999;
        background-color: #0B192C;
        color: #D4AF37;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        pointer-events: none;
        transition: top 0.15s ease, left 0.15s ease;
        white-space: nowrap;
        border: 1px solid rgba(212, 175, 55, 0.5);
      }
      @keyframes skipliHighlightPulse {
        0% {
          background-color: rgba(212, 175, 55, 0.38) !important;
          outline: 3px solid #D4AF37 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.45), 0 0 30px rgba(212, 175, 55, 0.75) !important;
        }
        25% {
          background-color: rgba(212, 175, 55, 0.45) !important;
          outline: 3px solid #D4AF37 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 8px rgba(212, 175, 55, 0.55), 0 0 40px rgba(212, 175, 55, 0.9) !important;
        }
        50% {
          background-color: rgba(212, 175, 55, 0.2) !important;
          outline: 2px solid #D4AF37 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.5) !important;
        }
        75% {
          background-color: rgba(212, 175, 55, 0.38) !important;
          outline: 3px solid #D4AF37 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 8px rgba(212, 175, 55, 0.55), 0 0 35px rgba(212, 175, 55, 0.85) !important;
        }
        100% {
          background-color: transparent !important;
          outline: 2px solid #0B192C !important;
          outline-offset: -2px !important;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.45) !important;
        }
      }
      .skipli-undo-highlight {
        animation: skipliHighlightPulse 2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        border-radius: 4px !important;
        transition: background-color 0.3s ease !important;
      }
    `;
  }, []);

  // Đảm bảo badge element tồn tại trong body của iframe
  const ensureBadgeElement = useCallback((doc: Document): HTMLElement => {
    let badge = doc.getElementById('skipli-inspector-badge');
    if (!badge) {
      badge = doc.createElement('div');
      badge.id = 'skipli-inspector-badge';
      badge.style.display = 'none';
      doc.body?.appendChild(badge);
    }
    return badge;
  }, []);

  // Dọn dẹp trạng thái inspector và text-editing trên iframe
  const cleanupInspectorUI = useCallback((doc: Document) => {
    const style = doc.getElementById('skipli-inspector-styles');
    if (style) style.remove();

    const badge = doc.getElementById('skipli-inspector-badge');
    if (badge) badge.remove();

    const hovered = doc.querySelectorAll('.skipli-hovered');
    hovered.forEach((el) => el.classList.remove('skipli-hovered'));

    const selected = doc.querySelectorAll('.skipli-selected');
    selected.forEach((el) => el.classList.remove('skipli-selected'));

    const editing = doc.querySelectorAll('.skipli-text-editing');
    editing.forEach((el) => {
      el.classList.remove('skipli-text-editing');
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });
  }, []);

  // Kích hoạt sửa chữ
  const startEditingElement = useCallback((targetEl: HTMLElement, doc: Document) => {
    const textEl = (targetEl.closest(TEXT_TAGS_SELECTOR) as HTMLElement) || targetEl;
    if (!textEl || textEl === doc.body) return;

    if (!textEl.dataset.originalContent) {
      textEl.dataset.originalContent = textEl.innerHTML;
    }

    // Chụp lại toàn bộ snapshot document trước khi người dùng gõ sửa chữ
    preEditTextSnapshotRef.current = getCleanBodySnapshot(doc);

    textEl.contentEditable = 'true';
    textEl.spellcheck = false;
    textEl.classList.add('skipli-text-editing');
    textEl.focus();

    const badge = doc.getElementById('skipli-inspector-badge');
    if (badge) badge.style.display = 'none';

    setIsEditingText(true);
    setActiveEditingElement(textEl);
  }, []);

  // Kết thúc sửa chữ
  const stopEditingElement = useCallback((targetEl: HTMLElement) => {
    targetEl.removeAttribute('contenteditable');
    targetEl.removeAttribute('spellcheck');
    targetEl.classList.remove('skipli-text-editing');

    if (targetEl.dataset.originalContent !== undefined && targetEl.innerHTML !== targetEl.dataset.originalContent) {
      setIsDirty(true);
      if (preEditTextSnapshotRef.current) {
        const targetSelector = getDomPath(targetEl);
        const doc = targetEl.ownerDocument;
        const scrollTop = doc?.documentElement?.scrollTop || doc?.body?.scrollTop || 0;
        historyManager.current.pushSnapshot(preEditTextSnapshotRef.current, 'Sửa chữ', targetSelector, scrollTop);
        syncHistoryState();
      }
    }
    delete targetEl.dataset.originalContent;
    preEditTextSnapshotRef.current = null;

    setIsEditingText(false);
    setActiveEditingElement(null);
    setSelectionPos(null);
  }, [syncHistoryState]);

  // Tự động cuộn đến phần tử hoàn tác, focus và chớp viền sáng rõ nét
  const handleRestoreVisualFeedback = useCallback((doc: Document, targetSelector?: string, fallbackScrollTop?: number) => {
    if (targetSelector) {
      try {
        let targetNode = doc.querySelector(targetSelector) as HTMLElement | null;
        if (!targetNode && !targetSelector.startsWith('body')) {
          targetNode = doc.querySelector(`body > ${targetSelector}`) as HTMLElement | null;
        }

        if (targetNode) {
          targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetNode.classList.remove('skipli-hovered');
          targetNode.classList.add('skipli-selected');
          targetNode.classList.add('skipli-undo-highlight');
          setSelectedElement(targetNode);

          // Áp dụng trực tiếp inline style vàng kim Luxury bảo đảm 100% hiển thị nổi bật
          const prevTransition = targetNode.style.transition;
          const prevBoxShadow = targetNode.style.boxShadow;
          const prevOutline = targetNode.style.outline;
          const prevOutlineOffset = targetNode.style.outlineOffset;
          const prevBg = targetNode.style.backgroundColor;

          targetNode.style.transition = 'all 0.25s ease';
          targetNode.style.backgroundColor = 'rgba(212, 175, 55, 0.4)';
          targetNode.style.outline = '3px solid #D4AF37';
          targetNode.style.outlineOffset = '2px';
          targetNode.style.boxShadow = '0 0 0 6px rgba(212, 175, 55, 0.45), 0 0 35px rgba(212, 175, 55, 0.85)';

          setTimeout(() => {
            targetNode.style.backgroundColor = 'rgba(212, 175, 55, 0.5)';
            targetNode.style.boxShadow = '0 0 0 8px rgba(212, 175, 55, 0.6), 0 0 45px rgba(212, 175, 55, 0.95)';
          }, 450);

          setTimeout(() => {
            targetNode.style.backgroundColor = 'rgba(212, 175, 55, 0.25)';
            targetNode.style.boxShadow = '0 0 0 5px rgba(212, 175, 55, 0.35), 0 0 25px rgba(212, 175, 55, 0.6)';
          }, 950);

          setTimeout(() => {
            targetNode.style.transition = prevTransition;
            targetNode.style.backgroundColor = prevBg;
            targetNode.style.outline = prevOutline;
            targetNode.style.outlineOffset = prevOutlineOffset;
            targetNode.style.boxShadow = prevBoxShadow;
            targetNode.classList.remove('skipli-undo-highlight');
          }, 2000);

          // Cập nhật vị trí thẻ badge inspector chỉ thẳng vào phần tử được hoàn tác
          const badge = ensureBadgeElement(doc);
          const updateBadgePosition = () => {
            const rect = targetNode.getBoundingClientRect();
            const scrollX = doc.defaultView?.scrollX || 0;
            const scrollY = doc.defaultView?.scrollY || 0;
            const top = Math.max(0, rect.top + scrollY - 24);
            const left = Math.max(0, rect.left + scrollX);
            badge.style.display = 'block';
            badge.style.top = `${top}px`;
            badge.style.left = `${left}px`;
            badge.textContent = `✨ ${getElementTagLabel(targetNode)}`;
          };

          updateBadgePosition();
          setTimeout(updateBadgePosition, 450);
          return;
        }
      } catch (err) {
        console.warn('[useVisualBridge] Failed to scroll to targetSelector:', err);
      }
    }

    setSelectedElement(null);
    if (fallbackScrollTop !== undefined) {
      doc.documentElement.scrollTop = fallbackScrollTop;
      if (doc.body) doc.body.scrollTop = fallbackScrollTop;
    }
  }, [ensureBadgeElement, setSelectedElement]);

  // Thực hiện Hoàn Tác (Undo)
  const performUndo = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc || !doc.body) return;

    const currentEditing = doc.querySelector('.skipli-text-editing') as HTMLElement;
    if (currentEditing) {
      stopEditingElement(currentEditing);
    }

    const currentCleanHtml = getCleanBodySnapshot(doc);
    const currentTargetSelector = getDomPath(selectedElementRef.current);
    const currentScrollTop = doc.documentElement.scrollTop || doc.body?.scrollTop || 0;
    const entry = historyManager.current.undo(currentCleanHtml, currentTargetSelector, currentScrollTop);
    if (!entry) return;

    doc.body.innerHTML = entry.html;
    injectInspectorStyles(doc);
    ensureBadgeElement(doc);
    setImageTarget(null);
    setCardSiblingInfo(null);
    setIsDirty(true);
    syncHistoryState();
    refreshSections();

    handleRestoreVisualFeedback(doc, entry.targetSelector, entry.scrollTop);
  }, [getIframeDoc, stopEditingElement, ensureBadgeElement, refreshSections, syncHistoryState, handleRestoreVisualFeedback, injectInspectorStyles]);

  // Thực hiện Làm Lại (Redo)
  const performRedo = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc || !doc.body) return;

    const currentEditing = doc.querySelector('.skipli-text-editing') as HTMLElement;
    if (currentEditing) {
      stopEditingElement(currentEditing);
    }

    const currentCleanHtml = getCleanBodySnapshot(doc);
    const currentTargetSelector = getDomPath(selectedElementRef.current);
    const currentScrollTop = doc.documentElement.scrollTop || doc.body?.scrollTop || 0;
    const entry = historyManager.current.redo(currentCleanHtml, currentTargetSelector, currentScrollTop);
    if (!entry) return;

    doc.body.innerHTML = entry.html;
    injectInspectorStyles(doc);
    ensureBadgeElement(doc);
    setImageTarget(null);
    setCardSiblingInfo(null);
    setIsDirty(true);
    syncHistoryState();
    refreshSections();

    handleRestoreVisualFeedback(doc, entry.targetSelector, entry.scrollTop);
  }, [getIframeDoc, stopEditingElement, ensureBadgeElement, refreshSections, syncHistoryState, handleRestoreVisualFeedback, injectInspectorStyles]);

  const resetHistory = useCallback(() => {
    historyManager.current.reset();
    syncHistoryState();
  }, [syncHistoryState]);

  // Helper tính toán thông tin Image Target
  const updateImageTarget = useCallback((target: HTMLElement) => {
    const imgEl = target.closest('img') || (isImageTarget(target) ? target : null);
    if (imgEl && imgEl !== target.ownerDocument?.body) {
      const info = extractImageSource(imgEl as HTMLElement);
      const rect = imgEl.getBoundingClientRect();
      const iframeRect = iframeRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
      setImageTarget({
        element: imgEl as HTMLElement,
        type: info.type,
        currentUrl: info.url,
        rect: {
          top: Math.round(iframeRect.top + rect.top + 8),
          left: Math.round(iframeRect.left + rect.left + 8),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    } else {
      if (!isImageModalOpen) {
        setImageTarget(null);
      }
    }
  }, [iframeRef, isImageModalOpen]);

  // Cập nhật thông tin thẻ con trong Grid/Flex
  const updateCardSibling = useCallback((target: HTMLElement) => {
    const iframeRect = iframeRef.current?.getBoundingClientRect();
    if (!iframeRect) return;

    // Tìm thẻ card tiềm năng (hoặc chính target nếu là card con)
    const cardCandidate = target.closest('div, article, li, a') as HTMLElement;
    if (cardCandidate) {
      const detected = detectCardSibling(cardCandidate, iframeRect);
      setCardSiblingInfo(detected);
    } else {
      setCardSiblingInfo(null);
    }
  }, [iframeRef]);

  // Hành động Lưu Thay Đổi
  const handleSave = useCallback(async () => {
    const doc = getIframeDoc();
    if (!doc || !onSaveHtml) return;

    // Chốt văn bản đang gõ dở nếu có trước khi trích xuất HTML sạch
    const currentEditing = doc.querySelector('.skipli-text-editing') as HTMLElement;
    if (currentEditing) {
      stopEditingElement(currentEditing);
    }

    try {
      setIsSaving(true);
      const cleanHtml = cleanInspectorArtifacts(doc);
      await onSaveHtml(cleanHtml);
      setIsDirty(false);
    } catch (err) {
      console.error('Lỗi khi lưu HTML trực quan:', err);
    } finally {
      setIsSaving(false);
    }
  }, [getIframeDoc, onSaveHtml, stopEditingElement]);

  // Thiết lập các listeners khi ở Edit Mode hoặc khi iframe load
  const attachBridgeListeners = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc || !doc.body) return;

    if (doc.documentElement) {
      doc.documentElement.setAttribute('data-skipli-mode', mode);
      if (mode === 'preview') {
        doc.body.classList.remove('skipli-visual-edit-active');
        doc.body.classList.add('skipli-preview-active');
      } else {
        doc.body.classList.remove('skipli-preview-active');
        doc.body.classList.add('skipli-visual-edit-active');
      }
    }

    if (mode === 'preview') {
      cleanupInspectorUI(doc);
      setSelectedElement(null);
      setIsEditingText(false);
      setActiveEditingElement(null);
      setSelectionPos(null);
      setImageTarget(null);
      setCardSiblingInfo(null);

      // Toast thông báo tương tác trong iframe khi ở chế độ xem thử (Preview Mode)
      const showPreviewToast = (message: string) => {
        let container = doc.getElementById('skipli-preview-toast-container');
        if (!container) {
          container = doc.createElement('div');
          container.id = 'skipli-preview-toast-container';
          container.style.cssText =
            'position: fixed; bottom: 20px; right: 20px; z-index: 9999999; pointer-events: none; ' +
            'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; ' +
            'display: flex; flex-direction: column; gap: 8px;';
          doc.body?.appendChild(container);
        }

        const toast = doc.createElement('div');
        toast.style.cssText =
          'background: #0B192C; color: #FAF9F6; border: 1px solid rgba(212, 175, 55, 0.6); ' +
          'padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 500; ' +
          'box-shadow: 0 10px 25px rgba(0,0,0,0.3); opacity: 0; transform: translateY(8px); ' +
          'transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; gap: 6px;';
        toast.innerHTML = `<span style="color:#D4AF37; font-weight:700;">✨ [Bản Xem Thử]</span> ${message}`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(8px)';
          setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
          }, 250);
        }, 2800);
      };

      // Chặn điều hướng của liên kết trong chế độ xem thử, nhưng BẢO LƯU tương tác nút bấm và JavaScript
      const handlePreviewClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        const link = target.closest('a');
        if (link) {
          const href = (link.getAttribute('href') || '').trim();

          // Case 1: Action links (# hoặc javascript:void) -> Chỉ chặn scroll lên top, CHO PHÉP bubble tới onclick/JS
          if (!href || href === '#' || href.startsWith('javascript:')) {
            e.preventDefault();
            // KHÔNG dừng propagation, KHÔNG hiện toast phiền hà để modal/drawer/tabs nhận được sự kiện
            return;
          }

          // Case 2: Hash link chuyển hướng nội bộ (#section-id) -> Cuộn mượt
          if (href.startsWith('#') && href.length > 1) {
            e.preventDefault();
            try {
              const targetEl = doc.querySelector(href) || doc.getElementById(href.slice(1));
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                return;
              }
            } catch {
              // fallback nếu selector không hợp lệ
            }
            showPreviewToast('Đã cuộn tới khối tương ứng!');
            return;
          }

          // Case 3: Liên kết ngoài tuyệt đối -> Mở tab trình duyệt mới
          if (href.startsWith('http://') || href.startsWith('https://')) {
            e.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
          }

          // Case 4: Mailto & Tel
          if (href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
          }

          // Case 5: Liên kết tương đối (/, /about, menu.html) -> Chặn tuyệt đối để không làm iframe điều hướng
          e.preventDefault();
          showPreviewToast(`Trang "${href}" sẽ hoạt động trên website thực tế khi xuất bản!`);
          return;
        }

        // Với button & form: KHÔNG chặn click! Cho phép 100% các nút (Modal, Tab, Cart Drawer, Counter +/-, Accordion) hoạt động tự nhiên!
      };

      const handlePreviewSubmit = (e: Event) => {
        e.preventDefault();
        showPreviewToast('Biểu mẫu đã ghi nhận thông tin trong giao diện xem thử!');
      };

      doc.addEventListener('click', handlePreviewClick, true);
      doc.addEventListener('submit', handlePreviewSubmit, true);

      return () => {
        doc.removeEventListener('click', handlePreviewClick, true);
        doc.removeEventListener('submit', handlePreviewSubmit, true);
        const container = doc.getElementById('skipli-preview-toast-container');
        if (container) container.remove();
      };
    }

    injectInspectorStyles(doc);
    const badge = ensureBadgeElement(doc);
    refreshSections();

    // 1. Chế độ Chỉnh Sửa Trực Quan (Visual Edit): Chặn click link và button để ưu tiên chọn phần tử thanh tra
    const handleInterceptClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.isContentEditable || target.closest('.skipli-text-editing')) {
        return;
      }

      const link = target.closest('a');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
      }

      const button = target.closest('button, [role="button"], input[type="button"], input[type="submit"]');
      if (button) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Nhận diện ảnh và thẻ card
      updateImageTarget(target);
      updateCardSibling(target);

      // Kích hoạt sửa chữ nếu click vào chữ đã chọn
      if (selectedElementRef.current && (selectedElementRef.current === target || selectedElementRef.current.contains(target))) {
        const textTarget = target.closest(TEXT_TAGS_SELECTOR) as HTMLElement;
        if (textTarget) {
          startEditingElement(textTarget, doc);
          return;
        }
      }

      // Hoàn tất sửa chữ khi click ra ngoài
      const currentEditing = doc.querySelector('.skipli-text-editing') as HTMLElement;
      if (currentEditing && !currentEditing.contains(target)) {
        stopEditingElement(currentEditing);
      }

      // Xử lý chọn phần tử (Selection Inspector)
      const selectable = target.closest('h1, h2, h3, h4, h5, h6, p, span, a, button, img, section, header, footer, div');
      if (selectable && selectable !== doc.body) {
        doc.querySelectorAll('.skipli-selected').forEach((el) => el.classList.remove('skipli-selected'));
        selectable.classList.add('skipli-selected');
        setSelectedElement(selectable as HTMLElement);
      }
    };

    // 2. Click đúp: Sửa chữ hoặc Mở Modal thay ảnh
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === doc.body) return;

      const imgTarget = target.closest('img') || (isImageTarget(target) ? target : null);
      if (imgTarget) {
        e.preventDefault();
        e.stopPropagation();
        updateImageTarget(target);
        setIsImageModalOpen(true);
        return;
      }

      const textTarget = target.closest(TEXT_TAGS_SELECTOR) as HTMLElement;
      if (textTarget) {
        e.preventDefault();
        e.stopPropagation();
        startEditingElement(textTarget, doc);
      }
    };

    const handleInterceptSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Xử lý phím tắt Lưu (Ctrl+S), Undo (Ctrl+Z) và Redo (Ctrl+Y, Ctrl+Shift+Z) trong iframe
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd) {
        const key = e.key.toLowerCase();

        // 1. Phím tắt Lưu (Ctrl+S / Cmd+S)
        if (key === 's') {
          e.preventDefault();
          e.stopPropagation();
          handleSave();
          return;
        }

        const isEditingInTarget = target && (target.isContentEditable || target.closest('.skipli-text-editing'));

        // Chỉ chặn và can thiệp Undo/Redo khi KHÔNG đang focus trực tiếp gõ chữ trong thẻ contenteditable
        if (!isEditingInTarget) {
          if (key === 'z') {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
              performRedo();
            } else {
              performUndo();
            }
            return;
          } else if (key === 'y') {
            e.preventDefault();
            e.stopPropagation();
            performRedo();
            return;
          }
        }
      }

      if (!target || !target.isContentEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        stopEditingElement(target);
        return;
      }

      const tagName = target.tagName.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button'].includes(tagName)) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          stopEditingElement(target);
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('skipli-text-editing')) {
        setTimeout(() => {
          const docActive = doc.activeElement;
          if (docActive !== target && !target.contains(docActive)) {
            stopEditingElement(target);
          }
        }, 150);
      }
    };

    // 5. Hover Inspector & Cập nhật card sibling
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === doc.body || target === badge || target.id === 'skipli-inspector-badge') {
        return;
      }

      if (target.isContentEditable || target.closest('.skipli-text-editing')) {
        badge.style.display = 'none';
        return;
      }

      const imgTarget = target.closest('img') || (isImageTarget(target) ? target : null);
      if (imgTarget) {
        updateImageTarget(target);
      }

      doc.querySelectorAll('.skipli-hovered').forEach((el) => el.classList.remove('skipli-hovered'));
      target.classList.add('skipli-hovered');

      const rect = target.getBoundingClientRect();
      const scrollX = doc.defaultView?.scrollX || 0;
      const scrollY = doc.defaultView?.scrollY || 0;

      const top = Math.max(0, rect.top + scrollY - 24);
      const left = Math.max(0, rect.left + scrollX);

      badge.style.display = 'block';
      badge.style.top = `${top}px`;
      badge.style.left = `${left}px`;
      badge.textContent = getElementTagLabel(target);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (!related || related === doc.body) {
        doc.querySelectorAll('.skipli-hovered').forEach((el) => el.classList.remove('skipli-hovered'));
        badge.style.display = 'none';
      }
    };

    const handleSelectionChange = () => {
      const pos = calculateSelectionPosition(iframeRef.current);
      setSelectionPos(pos);
    };

    doc.addEventListener('click', handleInterceptClick, true);
    doc.addEventListener('dblclick', handleDoubleClick, true);
    doc.addEventListener('submit', handleInterceptSubmit, true);
    doc.addEventListener('keydown', handleKeyDown);
    doc.addEventListener('focusout', handleFocusOut);
    doc.addEventListener('mouseover', handleMouseOver);
    doc.addEventListener('mouseout', handleMouseOut);
    doc.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      doc.removeEventListener('click', handleInterceptClick, true);
      doc.removeEventListener('dblclick', handleDoubleClick, true);
      doc.removeEventListener('submit', handleInterceptSubmit, true);
      doc.removeEventListener('keydown', handleKeyDown);
      doc.removeEventListener('focusout', handleFocusOut);
      doc.removeEventListener('mouseover', handleMouseOver);
      doc.removeEventListener('mouseout', handleMouseOut);
      doc.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [
    mode,
    getIframeDoc,
    injectInspectorStyles,
    ensureBadgeElement,
    cleanupInspectorUI,
    startEditingElement,
    stopEditingElement,
    updateImageTarget,
    updateCardSibling,
    refreshSections,
    iframeRef,
    performUndo,
    performRedo,
    handleSave,
  ]);

  useEffect(() => {
    const cleanup = attachBridgeListeners();

    const iframe = iframeRef.current;
    const handleIframeLoad = () => {
      attachBridgeListeners();
      refreshSections();
    };

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (cleanup) cleanup();
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [attachBridgeListeners, refreshSections, iframeRef]);

  // Lắng nghe phím tắt Ctrl+S / Ctrl+Z / Ctrl+Y từ Parent React Window
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'visual_edit') return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key.toLowerCase();

      // 1. Phím tắt Lưu (Ctrl+S / Cmd+S)
      if (key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Bỏ qua Undo/Redo nếu người dùng đang nhập liệu trên các input bên ngoài (ví dụ thanh Chat)
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          performRedo();
        } else {
          performUndo();
        }
      } else if (key === 'y') {
        e.preventDefault();
        performRedo();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [mode, performUndo, performRedo, handleSave]);

  // Cảnh báo chống mất dữ liệu khi người dùng chưa lưu mà vô tình F5 hoặc đóng Tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Chuẩn W3C để trình duyệt hiển thị hộp thoại cảnh báo rời đi
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Thực thi lệnh định dạng văn bản
  const applyFormat = useCallback((command: string, value?: string) => {
    const doc = getIframeDoc();
    if (!doc) return;

    captureSnapshot('Định dạng chữ', selectedElement);
    executeFormatCommand(doc, command, value);
    setIsDirty(true);

    setTimeout(() => {
      const pos = calculateSelectionPosition(iframeRef.current);
      if (pos) setSelectionPos(pos);
    }, 50);
  }, [getIframeDoc, iframeRef, captureSnapshot, selectedElement]);

  // Thay thế ảnh
  const replaceSelectedImage = useCallback((newUrl: string) => {
    if (!imageTarget || !imageTarget.element) return;
    captureSnapshot('Đổi ảnh', imageTarget.element);
    applyImageToElement(imageTarget.element, newUrl);
    setIsDirty(true);
    setImageTarget((prev) => (prev ? { ...prev, currentUrl: newUrl } : null));
  }, [imageTarget, captureSnapshot]);

  // Điều khiển Modal thay ảnh
  const openImageModal = useCallback(() => setIsImageModalOpen(true), []);
  const closeImageModal = useCallback(() => setIsImageModalOpen(false), []);

  // Điều khiển Section Navigator Drawer
  const toggleSectionDrawer = useCallback(() => {
    setIsSectionDrawerOpen((prev) => {
      if (!prev) refreshSections();
      return !prev;
    });
  }, [refreshSections]);

  const closeSectionDrawer = useCallback(() => setIsSectionDrawerOpen(false), []);

  // Hoán đổi vị trí 2 Section
  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    captureSnapshot('Đổi thứ tự khối', sectionsList[fromIndex]?.element);
    const success = moveSectionInDOM(sectionsList, fromIndex, toIndex);
    if (success) {
      setIsDirty(true);
      refreshSections();
    }
  }, [sectionsList, refreshSections, captureSnapshot]);

  // Ẩn / Hiện Section
  const toggleHideSection = useCallback((index: number) => {
    const sec = sectionsList[index];
    if (sec && sec.element) {
      captureSnapshot('Ẩn/hiện khối', sec.element);
      toggleSectionVisibilityInDOM(sec.element);
      setIsDirty(true);
      refreshSections();
    }
  }, [sectionsList, refreshSections, captureSnapshot]);

  // Cuộn tới Section
  const scrollToSection = useCallback((element: HTMLElement) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const doc = getIframeDoc();
    if (doc) {
      doc.querySelectorAll('.skipli-selected').forEach((el) => el.classList.remove('skipli-selected'));
      element.classList.add('skipli-selected');
      setSelectedElement(element);
    }
  }, [getIframeDoc]);

  // Hoán đổi vị trí Card con trong Grid
  const moveCardSibling = useCallback((direction: 'prev' | 'next') => {
    if (!cardSiblingInfo) return;
    captureSnapshot('Đổi thứ tự thẻ', cardSiblingInfo.element);
    const success = moveCardSiblingInDOM(cardSiblingInfo.element, direction);
    if (success) {
      setIsDirty(true);
      const iframeRect = iframeRef.current?.getBoundingClientRect();
      if (iframeRect) {
        const updated = detectCardSibling(cardSiblingInfo.element, iframeRect);
        setCardSiblingInfo(updated);
      }
    }
  }, [cardSiblingInfo, iframeRef, captureSnapshot]);

  // Lấy HTML sạch
  const cleanHtmlForExport = useCallback((): string | null => {
    const doc = getIframeDoc();
    if (!doc) return null;
    return cleanInspectorArtifacts(doc);
  }, [getIframeDoc]);

  // Toggle mode
  const toggleMode = useCallback((newMode: CanvasEditorMode) => {
    setMode(newMode);
    if (newMode === 'preview') {
      setIsEditingText(false);
      setActiveEditingElement(null);
      setSelectionPos(null);
      setImageTarget(null);
      setIsImageModalOpen(false);
      setIsSectionDrawerOpen(false);
      setCardSiblingInfo(null);
    } else {
      refreshSections();
    }
  }, [refreshSections]);

  return {
    mode,
    setMode: toggleMode,
    isDirty,
    setIsDirty,
    isSaving,
    selectedElement,
    setSelectedElement,
    isEditingText,
    activeEditingElement,
    selectionPos,
    applyFormat,
    imageTarget,
    isImageModalOpen,
    openImageModal,
    closeImageModal,
    replaceSelectedImage,
    isSectionDrawerOpen,
    sectionsList,
    toggleSectionDrawer,
    closeSectionDrawer,
    reorderSections,
    toggleHideSection,
    scrollToSection,
    cardSiblingInfo,
    moveCardSibling,
    handleSave,
    cleanHtmlForExport,
    performUndo,
    performRedo,
    resetHistory,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    undoCount: historyState.undoCount,
    redoCount: historyState.redoCount,
    lastUndoLabel: historyState.lastUndoLabel,
    lastRedoLabel: historyState.lastRedoLabel,
  };
}
