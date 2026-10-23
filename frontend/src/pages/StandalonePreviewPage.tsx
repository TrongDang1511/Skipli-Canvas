import { FC, useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionApi } from '../services/session.api';
import { Session } from '../types/session.types';
import { ViewportMode } from '../types/chat.types';
import { cn } from '../utils/cn';
import {
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function prepareSafeStandaloneHtml(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return '';

  const guardScript = `
<script id="skipli-standalone-guard">
(function() {
  function showToast(message) {
    var c = document.getElementById('skipli-toast-box');
    if (!c) {
      c = document.createElement('div');
      c.id = 'skipli-toast-box';
      c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(c);
    }
    var t = document.createElement('div');
    t.style.cssText = 'background:#0B192C;color:#FAF9F6;border:1px solid rgba(212,175,55,0.7);padding:10px 16px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 12px 28px rgba(0,0,0,0.3);opacity:0;transform:translateY(10px);transition:all 0.25s ease;display:flex;align-items:center;gap:8px;';
    t.innerHTML = '<span style="color:#D4AF37;font-weight:700;">✨</span> ' + message;
    c.appendChild(t);
    setTimeout(function() { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }, 10);
    setTimeout(function() {
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2800);
  }

  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a) {
      var href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#' || href.startsWith('javascript:')) {
        e.preventDefault();
        return;
      }
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        try {
          var target = document.querySelector(href) || document.getElementById(href.slice(1));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        } catch(err) {}
        return;
      }
      if (href.startsWith('http://') || href.startsWith('https://')) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      e.preventDefault();
      showToast('Page link "' + href + '" will be active when published!');
    }
  }, true);

  document.addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('Form submission simulated successfully!');
  }, true);
})();
</script>
`;

  if (rawHtml.includes('</body>')) {
    return rawHtml.replace('</body>', `${guardScript}</body>`);
  }
  return rawHtml + guardScript;
}

export const StandalonePreviewPage: FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isPillCollapsed, setIsPillCollapsed] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is missing');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    sessionApi
      .fetchSessionDetail(sessionId)
      .then(async (detail) => {
        if (!isMounted) return;
        if (!detail || !detail.session) {
          setError('Session not found or has been deleted');
          return;
        }

        setSession(detail.session);

        // Fetch HTML content: priority to presignedUrl, fallback to latestHtml
        if (detail.session.presignedUrl) {
          try {
            const res = await fetch(detail.session.presignedUrl, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
              if (isMounted) setHtmlContent(text);
              return;
            }
          } catch {
            // Fallback to latestHtml
          }
        }

        if (isMounted) {
          setHtmlContent(detail.session.latestHtml || '');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load preview session';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, reloadKey]);

  const safeHtml = useMemo(() => prepareSafeStandaloneHtml(htmlContent), [htmlContent]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] text-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
          <h2 className="text-lg font-semibold tracking-tight text-[#0B192C]">Loading Live Preview</h2>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
        <p className="mt-2 text-xs text-slate-500">Retrieving website build...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] px-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Unable to Load Preview</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'Session not found'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#0B192C] text-[#FAF9F6] rounded-xl text-xs font-semibold hover:bg-[#1E3E62] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getContainerStyles = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] h-[85vh] rounded-[36px] border-[8px] border-slate-800 shadow-2xl my-auto overflow-hidden bg-white';
      case 'tablet':
        return 'w-[768px] h-[90vh] rounded-2xl border-4 border-slate-700 shadow-2xl my-auto overflow-hidden bg-white';
      case 'desktop':
      default:
        return 'w-full h-full bg-white';
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#1E293B] flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Floating Header / Control Pill */}
      <div
        className={cn(
          'absolute top-4 z-50 transition-all duration-300 ease-out flex items-center',
          isPillCollapsed ? '-translate-y-20' : 'translate-y-0'
        )}
      >
        <div className="bg-[#0B192C]/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-3 text-xs">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-semibold text-white truncate max-w-[160px] md:max-w-xs">
              {session.title || 'Untitled Website'}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
              v1.{session.versionCount || 1}
            </span>
          </div>

          {/* Viewport switchers */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-full border border-slate-700/60">
            <button
              onClick={() => setViewport('desktop')}
              className={cn(
                'p-1.5 rounded-full transition cursor-pointer',
                viewport === 'desktop' ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              )}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={cn(
                'p-1.5 rounded-full transition cursor-pointer',
                viewport === 'tablet' ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              )}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={cn(
                'p-1.5 rounded-full transition cursor-pointer',
                viewport === 'mobile' ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              )}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/80">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-1.5 text-slate-400 hover:text-white transition rounded-full hover:bg-slate-800 cursor-pointer"
              title="Reload preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate(`/workspace/${session.id}`)}
              className="flex items-center gap-1 px-3 py-1 bg-[#D4AF37] hover:bg-[#c59e2b] text-slate-950 rounded-full font-bold text-[11px] transition shadow-xs cursor-pointer ml-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in Editor</span>
            </button>

            <button
              onClick={() => setIsPillCollapsed(true)}
              className="p-1 text-slate-400 hover:text-white transition rounded-full hover:bg-slate-800 cursor-pointer"
              title="Hide toolbar"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Re-expand pill button when collapsed */}
      {isPillCollapsed && (
        <button
          onClick={() => setIsPillCollapsed(false)}
          className="absolute top-3 right-4 z-50 p-2 bg-[#0B192C]/80 hover:bg-[#0B192C] text-white rounded-full border border-slate-700 shadow-xl transition cursor-pointer"
          title="Show toolbar"
        >
          <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
        </button>
      )}

      {/* Website Render Container */}
      <div className={cn('transition-all duration-300 flex items-center justify-center', getContainerStyles())}>
        <iframe
          ref={iframeRef}
          srcDoc={safeHtml}
          title={session.title || 'Skipli Live Preview'}
          sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
          className="w-full h-full border-0 select-text"
        />
      </div>
    </div>
  );
};
