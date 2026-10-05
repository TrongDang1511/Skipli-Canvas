import { ReactNode, FC } from 'react';
import { ArrowUpRight, ArrowUp, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthLayout: FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen w-full bg-beige-50 flex flex-col lg:flex-row font-sans text-navy-950 selection:bg-gold-200">
      {/* LEFT PANEL: Auth Form Area (Chiếm không gian chính 56%-60%) */}
      <div className="w-full lg:w-[56%] xl:w-[58%] flex flex-col justify-between p-8 sm:p-14 lg:p-18 xl:p-22 bg-white border-r border-beige-200 z-10">
        <div className="max-w-lg w-full mx-auto">
          {/* Logo & Brand Header: Logo đã crop sạch viền trong suốt, chữ nằm sát rạt biểu tượng */}
          <div className="flex items-center gap-2 sm:gap-2.5 mb-6 sm:mb-8">
            <img
              src="/Skipli_logo.png"
              alt="Skipli Logo"
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain shrink-0 drop-shadow-sm transition-transform hover:scale-105 select-none"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#E11D48] tracking-tight">
                Skipli
              </span>
              <span className="font-serif italic font-bold text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-r from-gold-600 via-amber-500 to-gold-400 bg-clip-text text-transparent">
                Canvas
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">{title}</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-navy-600 leading-relaxed">{subtitle}</p>
          </div>

          {/* Form Content */}
          {children}
        </div>

        {/* Footer info */}
        <div className="max-w-lg w-full mx-auto pt-10 border-t border-beige-100 text-[11px] text-navy-400 flex items-center justify-between">
          <span>© 2026 Skipli Inc. All rights reserved.</span>
          <span className="flex items-center gap-1 hover:text-navy-700 cursor-pointer transition-colors">
            Bảo mật & Điều khoản <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Visual Hero Area (Gradient Navy Blue + Aurora Glow + Floating Lovable-style Prompt Bar) */}
      <div className="hidden lg:flex flex-1 relative p-8 xl:p-12 items-center justify-center overflow-hidden bg-[#0B192C]">
        {/* Navy Aurora Glowing Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B192C] via-[#152e4d] to-[#081220]" />
        
        {/* Glowing Orbs (Navy + Blue + Subtle Gold Accent) */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ambient Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Floating Center Prompt Box (Mô phỏng Lovable style thanh lịch) */}
        <div className="relative w-full max-w-md z-10">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-2 shadow-2xl shadow-navy-950/60 flex items-center gap-3 group transition-all duration-300 hover:border-gold-400/40">
            {/* Logo Icon inside input bar */}
            <div className="pl-3 py-1 flex items-center shrink-0">
              <img
                src="/Skipli_logo.png"
                alt="Skipli"
                className="h-6 w-auto object-contain opacity-90"
              />
            </div>

            {/* Prompt text with blinking cursor */}
            <div className="flex-1 flex items-center text-xs sm:text-sm text-beige-100 font-medium tracking-wide">
              <span>Ask Skipli Canvas to build your next web app</span>
              <span className="inline-block w-0.5 h-4 bg-gold-400 ml-1 animate-pulse" />
            </div>

            {/* Submit Arrow Button */}
            <button
              type="button"
              className="w-8 h-8 rounded-xl bg-white text-navy-950 flex items-center justify-center shrink-0 shadow-md group-hover:bg-gold-500 group-hover:text-navy-950 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Feature Badge */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-navy-900/80 text-gold-300 border border-gold-500/30 backdrop-blur-md shadow-xs">
              <Sparkles className="w-3 h-3 text-gold-400" />
              Powered by Skipli AI Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
