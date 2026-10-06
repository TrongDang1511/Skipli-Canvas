import { FC, useRef } from 'react';
import { ViewportMode } from '../../../types/chat.types';
import { cn } from '../../../utils/cn';
import { RotateCw, ExternalLink, Globe, Sparkles, Loader2 } from 'lucide-react';

interface CanvasPreviewProps {
  htmlContent: string;
  viewport: ViewportMode;
  isStreaming: boolean;
}

function prepareSafePreviewHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  const interceptorScript = `
    <style>
      #skipli-toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .skipli-toast-msg {
        background: #0B192C;
        color: #F8F9FA;
        border: 1px solid #D4AF37;
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 13px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        margin-top: 8px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .skipli-toast-msg.show {
        opacity: 1;
        transform: translateY(0);
      }
    </style>
    <div id="skipli-toast-container"></div>
    <script>
      (function() {
        function showToast(message) {
          var container = document.getElementById('skipli-toast-container');
          if (!container) return;
          var toast = document.createElement('div');
          toast.className = 'skipli-toast-msg';
          toast.innerHTML = '✨ <span style="color:#D4AF37; font-weight:600;">[Bản Xem Thử]</span> ' + message;
          container.appendChild(toast);
          setTimeout(function() { toast.classList.add('show'); }, 10);
          setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
          }, 3000);
        }

        document.addEventListener('click', function(e) {
          var a = e.target.closest('a');
          if (a) {
            var href = a.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
              e.preventDefault();
              try {
                var target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              } catch(err) {}
              return;
            } else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
              e.preventDefault();
              window.open(href, '_blank');
              return;
            } else {
              e.preventDefault();
              showToast('Liên kết này sẽ chuyển hướng trên website thực tế!');
              return;
            }
          }

          var btn = e.target.closest('button, input[type="submit"], input[type="button"], [role="button"]');
          if (btn) {
            if (btn.type === 'submit') {
              e.preventDefault();
            }
            showToast('Nút bấm đã phản hồi tương tác trong giao diện xem thử!');
          }
        }, true);

        document.addEventListener('submit', function(e) {
          e.preventDefault();
          showToast('Đã ghi nhận dữ liệu biểu mẫu trong bản xem thử!');
        }, true);

        window.onbeforeunload = function() { return null; };
      })();
    </script>
  `;

  if (rawHtml.includes('</body>')) {
    return rawHtml.replace('</body>', `${interceptorScript}</body>`);
  }
  return rawHtml + interceptorScript;
}

export const CanvasPreview: FC<CanvasPreviewProps> = ({
  htmlContent,
  viewport,
  isStreaming,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const safeHtml = prepareSafePreviewHtml(htmlContent);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = safeHtml;
    }
  };

  const handleOpenNewTab = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getContainerStyles = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] h-[85vh] rounded-[36px] border-[6px] border-slate-700 shadow-2xl my-auto';
      case 'tablet':
        return 'w-[768px] h-[90vh] rounded-2xl border-4 border-slate-700 shadow-2xl my-auto';
      case 'desktop':
      default:
        return 'w-full h-full rounded-lg border border-slate-800 shadow-md';
    }
  };

  return (
    <main className="flex-1 bg-[#070F1E] flex flex-col h-full overflow-hidden p-3 relative text-stone-200">
      <div className="h-9 bg-[#0B192C] border border-slate-800 rounded-lg px-3 flex items-center justify-between text-xs text-stone-300 mb-2 shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <button
            onClick={handleRefresh}
            title="Tải lại trang"
            className="p-1 text-stone-400 hover:text-white rounded transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 max-w-md mx-4 bg-[#112240] border border-slate-700/80 rounded-md px-3 py-1 flex items-center gap-2 text-[11px] text-stone-300 font-mono">
          <Globe className="w-3 h-3 text-[#D4AF37]" />
          <span className="truncate">https://preview.skipli-canvas.app/landing-page</span>
          {isStreaming && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-[#D4AF37] font-sans font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
              <span>Đang kiến tạo...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewTab}
            disabled={!htmlContent}
            title="Mở toàn màn hình"
            className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-[#D4AF37] font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Toàn màn hình</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#091326] rounded-xl border border-slate-800/80 flex items-center justify-center p-2 overflow-hidden relative">
        {isStreaming && (
          <div className="absolute inset-0 z-40 bg-[#0B192C]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <Loader2 className="w-9 h-9 text-[#D4AF37] animate-spin mb-3" />
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Skipli AI Engine đang kiến tạo giao diện...</span>
            </h3>
            <p className="text-xs text-stone-300 mt-1 font-sans">
              Đang phân tích yêu cầu và render trực tiếp lên Live Preview
            </p>
          </div>
        )}

        <div className={cn('transition-all duration-300 ease-out bg-white overflow-hidden flex flex-col relative', getContainerStyles())}>
          {safeHtml ? (
            <iframe
              ref={iframeRef}
              title="Skipli Live Preview"
              srcDoc={safeHtml}
              sandbox="allow-scripts allow-forms allow-popups"
              className="w-full h-full border-none bg-white"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white text-slate-400 p-6 text-center select-none">
              <Globe className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Khung xem trước trực tiếp (Live Preview)</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Nhập yêu cầu vào khung chat bên trái để AI tự động vẽ giao diện website tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
