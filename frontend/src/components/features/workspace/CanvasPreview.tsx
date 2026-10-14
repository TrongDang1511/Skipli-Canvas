import { FC, useRef, useState, useEffect } from 'react';
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

interface CanvasPreviewProps {
  presignedUrl?: string;
  htmlContent?: string;
  onSaveHtml?: (cleanHtml: string) => Promise<void>;
  viewport: ViewportMode;
  setViewport: (mode: ViewportMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExport: () => void;
  isStreaming: boolean;
}

export const CanvasPreview: FC<CanvasPreviewProps> = ({
  presignedUrl,
  htmlContent,
  onSaveHtml,
  viewport,
  setViewport,
  viewMode,
  setViewMode,
  onExport,
  isStreaming,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasStorageError, setHasStorageError] = useState<boolean>(false);
  const [isCheckingS3, setIsCheckingS3] = useState<boolean>(false);
  const [currentHtml, setCurrentHtml] = useState<string>(htmlContent || '');

  // Đồng bộ prop htmlContent khi có thay đổi từ bên ngoài (ví dụ AI sinh code mới)
  useEffect(() => {
    if (htmlContent) {
      setCurrentHtml(htmlContent);
    }
  }, [htmlContent]);

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

  // Tải kiểm tra nội dung tệp từ S3 nếu chưa có chuỗi htmlContent
  useEffect(() => {
    if (!presignedUrl) {
      setHasStorageError(false);
      return;
    }

    let isMounted = true;
    setIsCheckingS3(true);
    setHasStorageError(false);

    fetch(presignedUrl)
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
          // Nếu chưa có htmlContent từ prop, lưu HTML tải được để phục vụ Visual Edit
          if (!htmlContent) {
            setCurrentHtml(text);
          }
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
  }, [presignedUrl, htmlContent]);

  const handleRefresh = () => {
    if (presignedUrl) {
      setIsCheckingS3(true);
      fetch(presignedUrl)
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
            if (iframeRef.current && !currentHtml) {
              const urlObj = new URL(presignedUrl);
              urlObj.searchParams.set('_r', Date.now().toString());
              iframeRef.current.src = urlObj.toString();
            }
          }
        })
        .catch(() => setHasStorageError(false))
        .finally(() => setIsCheckingS3(false));
    }
  };

  const handleOpenNewTab = () => {
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
              <span>Skipli AI Engine đang kiến tạo giao diện...</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-stone-300 mt-1 font-sans">
              Đang phân tích yêu cầu và render trực tiếp lên Live Preview
            </p>
          </div>
        )}

        <div className={cn('transition-all duration-300 ease-out bg-white dark:bg-[#0B192C] overflow-hidden flex flex-col relative', getContainerStyles())}>
          {hasStorageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F6] dark:bg-[#081220] select-none">
              <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FileQuestion className="w-8 h-8 stroke-[1.75] text-[#D4AF37]" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                Tệp Giao Diện Không Còn Tồn Tại
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-stone-400 max-w-sm mb-4 leading-relaxed font-sans">
                Mã nguồn HTML phiên bản này đã bị xóa hoặc không còn tồn tại trên hệ thống lưu trữ Cloud.
              </p>

              <div className="bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-w-xs text-left text-[11px] text-slate-600 dark:text-stone-300 shadow-xs mb-4">
                <div className="flex items-center gap-1.5 font-semibold text-[#D4AF37] mb-1">
                  <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>Hướng xử lý:</span>
                </div>
                <span>Gửi câu lệnh mới ở khung chat bên trái để AI tự động kiến tạo lại giao diện website cho phiên này.</span>
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-slate-950 dark:bg-[#1E3E62] dark:hover:bg-[#28507e] dark:text-[#D4AF37] rounded-xl font-bold text-xs transition border border-amber-400/60 cursor-pointer shadow-xs active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>Thử Kiểm Tra Lại</span>
              </button>
            </div>
          ) : currentHtml ? (
            /* Khi có mã HTML: Sử dụng srcDoc để có cùng origin với Parent React, cho phép can thiệp DOM 100% không bị CORS chặn */
            <iframe
              ref={iframeRef}
              title="Skipli Live Preview"
              srcDoc={currentHtml}
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
              className="w-full h-full border-none bg-white"
            />
          ) : presignedUrl ? (
            /* Fallback nạp qua presignedUrl khi chưa lấy được nội dung HTML */
            <iframe
              ref={iframeRef}
              title="Skipli Live Preview"
              src={presignedUrl}
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
              className="w-full h-full border-none bg-white"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#0B192C] text-slate-400 p-6 text-center select-none">
              <Globe className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-stone-200">Khung xem trước trực tiếp (Live Preview)</p>
              <p className="text-xs text-slate-400 dark:text-stone-400 mt-1 max-w-xs">
                Nhập yêu cầu vào khung chat bên trái để AI tự động vẽ giao diện website tại đây.
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
