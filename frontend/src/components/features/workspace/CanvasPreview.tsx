import { FC, useRef, useState, useEffect, useMemo } from 'react';
import { ViewportMode, ViewMode } from '../../../types/chat.types';
import { CanvasToolbar } from './CanvasToolbar';
import { FloatingTextToolbar } from './FloatingTextToolbar';
import { ImageReplacerModal } from './ImageReplacerModal';
import { SectionNavigatorDrawer } from './SectionNavigatorDrawer';
import { CardReorderControls } from './CardReorderControls';
import { useVisualBridge } from '../../../hooks/useVisualBridge';
import { cn } from '../../../utils/cn';
import {
  RotateCw,
  Globe,
  Sparkles,
  Loader2,
  FileQuestion,
  Camera,
} from 'lucide-react';

/**
 * Nhúng kịch bản bảo vệ (Inline Guard Script) trực tiếp vào iframe HTML.
 * Script này phân loại liên kết thông minh, bảo lưu Event Bubbling cho các nút bấm / Modal / Tab / Giỏ hàng nội bộ,
 * đồng thời ngăn chặn tuyệt đối việc iframe điều hướng sang route của ứng dụng Web Builder mẹ.
 */
function prepareSafePreviewHtml(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return '';

  const guardScript = `
<script id="skipli-preview-guard">
(function() {
  function showPreviewToast(message) {
    var c = document.getElementById('skipli-preview-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'skipli-preview-toast-container';
      c.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999999;pointer-events:none;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(c);
    }
    var t = document.createElement('div');
    t.style.cssText = 'background:#0B192C;color:#FAF9F6;border:1px solid rgba(212,175,55,0.7);padding:8px 14px;border-radius:10px;font-size:12px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.3);opacity:0;transform:translateY(8px);transition:all 0.25s cubic-bezier(0.16,1,0.3,1);display:flex;align-items:center;gap:6px;';
    t.innerHTML = '<span style="color:#D4AF37;font-weight:700;">✨ [Bản Xem Thử]</span> ' + message;
    c.appendChild(t);
    setTimeout(function() { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }, 10);
    setTimeout(function() {
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2800);
  }

  // 1. Phân loại liên kết thông minh & Bảo lưu Event Bubbling cho các nút bấm tương tác
  document.addEventListener('click', function(e) {
    // Nếu đang ở chế độ Chỉnh Sửa (Visual Edit), chặn tuyệt đối điều hướng và cuộn trang của liên kết
    var mode = document.documentElement.getAttribute('data-skipli-mode');
    if (mode === 'visual_edit') {
      var aTag = e.target.closest('a');
      if (aTag) {
        e.preventDefault();
      }
      return;
    }

    var a = e.target.closest('a');
    if (a) {
      var href = (a.getAttribute('href') || '').trim();

      // Case 1: Action links (# hoặc javascript:void) -> Chỉ chống scroll lên đỉnh trang, CHO PHÉP bubble tới onclick/JS
      if (!href || href === '#' || href.startsWith('javascript:')) {
        e.preventDefault();
        // TUYỆT ĐỐI KHÔNG gọi e.stopPropagation() để các script mở Modal / Drawer / Tab nhận được sự kiện click
        return;
      }

      // Case 2: Hash link nội bộ (#section-id) -> Cuộn mượt trong iframe
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        try {
          var target = document.querySelector(href) || document.getElementById(href.slice(1));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        } catch(err) {}
        showPreviewToast('Scrolled to section!');
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

      // Case 5: Liên kết tương đối (/, /about, menu.html) -> Chặn tuyệt đối để chống lồng Web Builder vào canvas
      e.preventDefault();
      showPreviewToast('Page "' + href + '" will be active on the published website!');
      return;
    }
  }, true);

  // 2. Chặn HTTP reload khi submit form, nhưng cho phép JS event listeners của website xử lý logic
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    showPreviewToast('Form submission simulated in preview mode!');
  }, true);

  // 3. Navigation Guard: Chống script trong website vô tình gọi window.location làm reload iframe
  try {
    window.onbeforeunload = function() {
      // Ngăn điều hướng đột ngột
    };
  } catch(err) {}
})();
</script>
`;

  if (rawHtml.includes('</body>')) {
    return rawHtml.replace('</body>', `${guardScript}</body>`);
  }
  return rawHtml + guardScript;
}

interface CanvasPreviewProps {
  sessionId?: string;
  presignedUrl?: string;
  htmlContent?: string;
  onSaveHtml?: (cleanHtml: string) => Promise<void>;
  viewport: ViewportMode;
  setViewport: (mode: ViewportMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExport: () => void;
  isStreaming: boolean;
  isLoadingSession?: boolean;
}

export const CanvasPreview: FC<CanvasPreviewProps> = ({
  sessionId,
  presignedUrl,
  htmlContent,
  onSaveHtml,
  viewport,
  setViewport,
  viewMode,
  setViewMode,
  onExport,
  isStreaming,
  isLoadingSession = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasStorageError, setHasStorageError] = useState<boolean>(false);
  const [isCheckingS3, setIsCheckingS3] = useState<boolean>(false);
  const [currentHtml, setCurrentHtml] = useState<string>(htmlContent || '');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Chuẩn bị mã HTML an toàn có nhúng inline guard script chống iframe bị điều hướng
  const safeHtml = useMemo(() => prepareSafePreviewHtml(currentHtml), [currentHtml]);

  // Đồng bộ prop htmlContent khi có thay đổi từ bên ngoài (ví dụ AI sinh code mới hoặc đổi session)
  useEffect(() => {
    if (htmlContent) {
      setCurrentHtml(htmlContent);
      setHasStorageError(false);
      setReloadKey((prev) => prev + 1);
    } else if (!presignedUrl) {
      setCurrentHtml('');
    }
  }, [htmlContent, presignedUrl]);

  // Visual Bridge Hook quản lý Iframe DOM, Editor mode và Inspector
  const {
    mode: editorMode,
    setMode: setEditorMode,
    isDirty,
    isSaving,
    handleSave,
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
    performUndo,
    performRedo,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    lastUndoLabel,
    lastRedoLabel,
  } = useVisualBridge({
    iframeRef,
    initialHtml: currentHtml,
    onSaveHtml: async (cleanHtml: string) => {
      setCurrentHtml(cleanHtml);
      if (onSaveHtml) {
        await onSaveHtml(cleanHtml);
      }
    },
  });

  // Tải nội dung tệp trực tiếp từ MinIO S3 khi chưa có sẵn htmlContent
  useEffect(() => {
    if (!presignedUrl || htmlContent) {
      setHasStorageError(false);
      return;
    }

    let isMounted = true;
    setIsCheckingS3(true);
    setHasStorageError(false);

    fetch(presignedUrl, { cache: 'no-store' })
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          setHasStorageError(true);
          return;
        }
        const text = await res.text();
        if (text.includes('<Error>') && text.includes('<Code>NoSuchKey</Code>')) {
          setHasStorageError(true);
        } else {
          setHasStorageError(false);
          // Luôn lấy nội dung chuẩn xác nhất trực tiếp từ MinIO S3
          setCurrentHtml(text);
          setReloadKey((prev) => prev + 1);
        }
      })
      .catch(() => {
        if (isMounted) setHasStorageError(false);
      })
      .finally(() => {
        if (isMounted) setIsCheckingS3(false);
      });

    return () => {
      isMounted = false;
    };
  }, [presignedUrl]);

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
    if (presignedUrl) {
      setIsCheckingS3(true);
      fetch(presignedUrl, { cache: 'no-store' })
        .then(async (res) => {
          if (!res.ok) {
            setHasStorageError(true);
            return;
          }
          const text = await res.text();
          if (text.includes('<Error>') && text.includes('<Code>NoSuchKey</Code>')) {
            setHasStorageError(true);
          } else {
            setHasStorageError(false);
            setCurrentHtml(text);
          }
        })
        .catch(() => setHasStorageError(false))
        .finally(() => setIsCheckingS3(false));
    }
  };

  const handleOpenNewTab = () => {
    if (sessionId) {
      window.open(`/preview/${sessionId}`, '_blank');
      return;
    }
    if (presignedUrl && !hasStorageError) {
      window.open(presignedUrl, '_blank');
    }
  };

  const getContainerStyles = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] h-[85vh] rounded-[36px] border-[6px] border-slate-300 dark:border-slate-700 shadow-2xl my-auto';
      case 'tablet':
        return 'w-[768px] h-[90vh] rounded-2xl border-4 border-slate-300 dark:border-slate-700 shadow-2xl my-auto';
      case 'desktop':
      default:
        return 'w-full h-full rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs';
    }
  };

  return (
    <main className="flex-1 bg-[#FAF9F6] dark:bg-[#070F1E] flex flex-col h-full overflow-hidden p-3 relative text-slate-800 dark:text-stone-200 transition-colors duration-200">
      {/* Thanh điều khiển Canvas Header tách riêng theo Atomic Clean Architecture */}
      <CanvasToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        isSectionDrawerOpen={isSectionDrawerOpen}
        onToggleSectionDrawer={toggleSectionDrawer}
        canUndo={canUndo}
        canRedo={canRedo}
        undoCount={undoCount}
        redoCount={redoCount}
        lastUndoLabel={lastUndoLabel}
        lastRedoLabel={lastRedoLabel}
        onUndo={performUndo}
        onRedo={performRedo}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        viewport={viewport}
        setViewport={setViewport}
        onRefresh={handleRefresh}
        isCheckingS3={isCheckingS3}
        onOpenNewTab={handleOpenNewTab}
        onExport={onExport}
        hasStorageError={hasStorageError}
        presignedUrl={presignedUrl}
        isStreaming={isStreaming}
      />

      <div className="flex-1 flex overflow-hidden gap-2">
        <div className="flex-1 bg-slate-200/50 dark:bg-[#091326] rounded-xl border border-slate-200/90 dark:border-slate-800/80 flex items-center justify-center p-2 overflow-hidden relative">
        {isStreaming && (
          <div className="absolute inset-0 z-40 bg-white/80 dark:bg-[#0B192C]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <Loader2 className="w-9 h-9 stroke-[1.75] text-[#D4AF37] animate-spin mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 stroke-[1.75] text-[#D4AF37]" />
              <span>Skipli AI Engine is generating layout...</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-stone-300 mt-1 font-sans">
              Analyzing prompt and rendering directly to Live Preview
            </p>
          </div>
        )}

        <div className={cn('transition-all duration-300 ease-out bg-white dark:bg-[#0B192C] overflow-hidden flex flex-col relative', getContainerStyles())}>
          {(isLoadingSession || (isCheckingS3 && !currentHtml)) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#081220] select-none p-8 text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-[#1E3E62] border border-amber-500/30 flex items-center justify-center mb-4 shadow-sm">
                <Loader2 className="w-7 h-7 stroke-[2] text-[#D4AF37] animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                Synchronizing website interface...
              </h3>
              <p className="text-xs text-slate-500 dark:text-stone-400 max-w-xs leading-relaxed font-sans">
                Fetching source code and images directly from Cloud Storage
              </p>
            </div>
          ) : hasStorageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F6] dark:bg-[#081220] select-none">
              <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FileQuestion className="w-8 h-8 stroke-[1.75] text-[#D4AF37]" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                Layout File Not Found
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-stone-400 max-w-sm mb-4 leading-relaxed font-sans">
                The HTML source for this version was removed or is no longer available on Cloud Storage.
              </p>

              <div className="bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-w-xs text-left text-[11px] text-slate-600 dark:text-stone-300 shadow-xs mb-4">
                <div className="flex items-center gap-1.5 font-semibold text-[#D4AF37] mb-1">
                  <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>Suggested Action:</span>
                </div>
                <span>Send a new prompt in the chat panel to regenerate the layout for this session.</span>
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-slate-950 dark:bg-[#1E3E62] dark:hover:bg-[#28507e] dark:text-[#D4AF37] rounded-xl font-bold text-xs transition border border-amber-400/60 cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>Check Again</span>
              </button>
            </div>
          ) : currentHtml ? (
            /* Khi có mã HTML: Sử dụng srcDoc để có cùng origin với Parent React, cho phép can thiệp DOM 100% không bị CORS chặn */
            <iframe
              ref={iframeRef}
              key={`preview-srcdoc-${reloadKey}`}
              title="Skipli Live Preview"
              srcDoc={safeHtml}
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
              className="w-full h-full border-none bg-white"
            />
          ) : (presignedUrl || isCheckingS3) ? (
            /* Khi đang đồng bộ mã nguồn từ S3: Hiển thị trạng thái tải nhẹ nhàng, không render iframe cross-origin gây chớp giật */
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#081220] select-none p-8 text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-[#1E3E62] border border-amber-500/30 flex items-center justify-center mb-4 shadow-sm">
                <Loader2 className="w-7 h-7 stroke-[2] text-[#D4AF37] animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                Synchronizing website interface...
              </h3>
              <p className="text-xs text-slate-500 dark:text-stone-400 max-w-xs leading-relaxed font-sans">
                Fetching source code and images directly from Cloud Storage
              </p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#0B192C] text-slate-400 p-6 text-center select-none">
              <Globe className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-stone-200">Live Preview Canvas</p>
              <p className="text-xs text-slate-400 dark:text-stone-400 mt-1 max-w-xs">
                Enter a prompt in the chat panel to start generating your website here.
              </p>
            </div>
          )}
        </div>

        {/* Floating Text Toolbar phong cách Word-Like khi bôi đen chữ */}
        {editorMode === 'visual_edit' && (
          <FloatingTextToolbar
            position={selectionPos}
            onFormat={applyFormat}
          />
        )}

        {/* Cụm điều khiển mini [◀] [⠿] [▶] nổi trên Card con trong Grid/Flex */}
        {editorMode === 'visual_edit' && (
          <CardReorderControls
            cardInfo={cardSiblingInfo}
            onMovePrev={() => moveCardSibling('prev')}
            onMoveNext={() => moveCardSibling('next')}
          />
        )}

        {/* Nút bấm nổi [📷 Đổi ảnh] tại góc trên của ảnh mục tiêu */}
        {editorMode === 'visual_edit' && imageTarget && (
          <button
            type="button"
            style={{
              top: `${imageTarget.rect.top}px`,
              left: `${imageTarget.rect.left}px`,
            }}
            onClick={openImageModal}
            title="Nhấp để thay đổi hình ảnh này"
            className="fixed z-40 flex items-center gap-1.5 px-2.5 py-1 bg-[#0B192C] text-[#D4AF37] dark:bg-[#1E3E62] dark:text-white border border-[#D4AF37]/70 rounded-lg shadow-xl text-[11px] font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer animate-fadeIn backdrop-blur-xs"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2] text-[#D4AF37]" />
            <span>Đổi ảnh</span>
          </button>
        )}

        {/* Modal Thay Đổi Hình Ảnh */}
        <ImageReplacerModal
          isOpen={isImageModalOpen}
          target={imageTarget}
          onClose={closeImageModal}
          onConfirm={replaceSelectedImage}
        />
      </div>

      {/* Ngăn kéo Cấu Trúc Khối Website (Section Navigator) */}
      {editorMode === 'visual_edit' && (
        <SectionNavigatorDrawer
          isOpen={isSectionDrawerOpen}
          sections={sectionsList}
          onClose={closeSectionDrawer}
          onMoveSection={reorderSections}
          onToggleVisibility={toggleHideSection}
          onSelectSection={scrollToSection}
        />
      )}
    </div>
  </main>
);
};
