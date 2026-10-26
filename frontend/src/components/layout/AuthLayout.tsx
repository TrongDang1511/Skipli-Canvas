import { ReactNode, FC } from 'react';
import { Globe, ShieldCheck, Zap, Layers } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AuthLayoutProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  children: ReactNode;
}

export const AuthLayout: FC<AuthLayoutProps> = ({
  mode,
  onSwitchMode,
  children,
}) => {
  return (
    <div className="min-h-dvh lg:h-screen w-full bg-[#FAF9F6] flex flex-col lg:flex-row font-sans text-[#0B192C] selection:bg-amber-100 lg:overflow-hidden">
      {/* =========================================================================
          LEFT PANEL: Clean Luxury Authentication Form (Tông Sáng Sang Trọng)
          ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-14 pt-safe pb-safe bg-[#FAF9F6] border-r border-slate-200/80 z-10 lg:h-full lg:overflow-y-auto">
        {/* Top Header: Logo */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 select-none">
            <img
              src="/Skipli_logo.png"
              alt="Skipli Logo"
              className="h-8 w-auto object-contain shrink-0 drop-shadow-2xs"
            />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-[#0B192C]">
                Skipli
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                Canvas
              </span>
            </div>
          </div>
        </div>

        {/* Center Content: Mode Tabs + Sliding Form Track */}
        <div className="max-w-md w-full mx-auto my-auto py-4 sm:py-6 shrink-0">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl mb-6 border border-slate-200/90 select-none">
            <button
              type="button"
              onClick={() => onSwitchMode('login')}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative z-10',
                mode === 'login'
                  ? 'bg-white text-[#0B192C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('register')}
              className={cn(
                'py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative z-10',
                mode === 'register'
                  ? 'bg-white text-[#0B192C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Create Account
            </button>
          </div>

          {children}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Lovable / Vercel Interactive Mock Canvas Showcase
          ========================================================================= */}
      <div className="hidden lg:flex flex-1 relative p-10 xl:p-14 flex-col justify-between overflow-hidden bg-[#0B192C] text-white lg:h-full">
        {/* Subtle Background Gradients & Tech Grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B192C] via-[#10243E] to-[#070F1E] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035] pointer-events-none" />

        {/* Top Badges Bar */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs text-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[11px]">Production Live Preview Engine</span>
          </div>
        </div>

        {/* Centerpiece: Floating Mock Canvas Window */}
        <div className="relative z-10 my-auto py-6 max-w-xl mx-auto w-full">
          {/* Main Browser Window */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
            {/* Browser Header Bar */}
            <div className="h-9 px-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-0.5 bg-slate-900 border border-slate-700/60 rounded-md text-[10px] text-slate-300 font-mono">
                <Globe className="w-2.5 h-2.5 text-[#D4AF37]" />
                <span className="truncate max-w-[200px]">preview.skipli-canvas.app/heritage-roasters</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-[#D4AF37] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                <span>v1.3</span>
              </div>
            </div>

            {/* Inner Mock Website Preview */}
            <div className="p-5 bg-[#FAF9F6] text-slate-900 space-y-4 select-none font-sans">
              {/* Mock Website Navbar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#0B192C] text-[#D4AF37] flex items-center justify-center text-xs font-extrabold">
                    H
                  </span>
                  <span className="font-extrabold text-xs tracking-tight text-[#0B192C]">
                    Heritage Coffee Roasters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 hidden sm:inline">Menu</span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">Our Story</span>
                  <span className="text-[10px] font-bold bg-[#0B192C] text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                    Cart <span className="bg-[#D4AF37] text-slate-950 px-1 rounded-full text-[9px]">2</span>
                  </span>
                </div>
              </div>

              {/* Mock Website Hero Section */}
              <div className="grid grid-cols-5 gap-3 items-center py-1">
                <div className="col-span-3 space-y-1.5">
                  <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    ★ 4.9/5 Heritage Quality
                  </span>
                  <h3 className="font-extrabold text-sm text-[#0B192C] leading-snug">
                    Artisan Roasts Crafted for True Connoisseurs
                  </h3>
                  <p className="text-[10px] text-slate-600 line-clamp-2">
                    Fresh single-origin beans roasted daily in Lower Manhattan. Order online with express delivery.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button type="button" className="text-[10px] font-bold bg-[#D4AF37] text-slate-950 px-2.5 py-1 rounded shadow-xs">
                      Order Online
                    </button>
                    <button type="button" className="text-[10px] font-medium text-slate-700 border border-slate-300 px-2.5 py-1 rounded">
                      Explore Beans
                    </button>
                  </div>
                </div>

                {/* Mock Card */}
                <div className="col-span-2 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
                  <div className="w-full h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    📷 Signature Roast
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#0B192C]">Sumatra Mandheling</span>
                    <span className="font-extrabold text-amber-600">$22.00</span>
                  </div>
                  <div className="w-full py-1 bg-slate-900 text-white text-[9px] font-bold rounded text-center">
                    + Add to Cart
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Pill Badges around the Canvas */}
          <div className="absolute -top-3 -right-3 bg-white text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce duration-1000">
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Interactive Live Preview</span>
          </div>

          <div className="absolute -bottom-4 -left-3 bg-[#0B192C]/95 text-white px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected Brand Media</span>
          </div>
        </div>

        {/* Bottom Feature Highlights Bar */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#D4AF37] font-bold text-xs">
              <Zap className="w-3 h-3" />
              <span>Intelligent Generation</span>
            </div>
            <p className="text-[11px] text-slate-400">Adaptive layouts & curated copy</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#D4AF37] font-bold text-xs">
              <Layers className="w-3 h-3" />
              <span>Visual Point & Click</span>
            </div>
            <p className="text-[11px] text-slate-400">Edit text & images effortlessly</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[#D4AF37] font-bold text-xs">
              <ShieldCheck className="w-3 h-3" />
              <span>Cloud Versioning</span>
            </div>
            <p className="text-[11px] text-slate-400">Rollback anytime with 0 data loss</p>
          </div>
        </div>
      </div>
    </div>
  );
};
