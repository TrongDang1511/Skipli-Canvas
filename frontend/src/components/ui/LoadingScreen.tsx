import { FC } from 'react';

export const LoadingScreen: FC = () => {
  return (
    <div className="min-h-screen w-full bg-beige-50 flex flex-col items-center justify-center font-sans select-none relative overflow-hidden">
      {/* Ambient subtle warm glow */}
      <div className="absolute w-80 h-80 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-72 h-72 bg-navy-900/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Transparent Minimalist Logo with subtle pulse */}
        <div className="mb-4 flex items-center justify-center">
          <img
            src="/Skipli_logo.png"
            alt="Skipli Logo"
            className="h-11 sm:h-12 w-auto object-contain animate-pulse select-none"
          />
        </div>

        {/* Brand Name */}
        <div className="flex items-center gap-2 mb-6">
          <span className="font-extrabold text-xl sm:text-2xl text-[#E11D48] tracking-tight">
            Skipli
          </span>
          <span className="font-serif italic font-bold text-xl sm:text-2xl bg-gradient-to-r from-gold-600 via-amber-500 to-gold-400 bg-clip-text text-transparent">
            Canvas
          </span>
        </div>

        {/* Minimalist Progress Bar */}
        <div className="w-40 sm:w-48 h-1 bg-beige-200 rounded-full overflow-hidden relative shadow-inner mb-3">
          <div className="absolute inset-y-0 bg-gradient-to-r from-navy-900 via-gold-500 to-navy-900 w-1/2 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
        </div>

        {/* Subtitle status text */}
        <p className="text-[11px] font-medium text-navy-500 tracking-wider">
          Đang đồng bộ phiên làm việc...
        </p>
      </div>
    </div>
  );
};
