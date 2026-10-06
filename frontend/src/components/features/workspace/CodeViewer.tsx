import { FC, useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeViewerProps {
  code: string;
}

export const CodeViewer: FC<CodeViewerProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.split('\n');

  return (
    <main className="flex-1 bg-[#0B192C] text-stone-100 flex flex-col h-full overflow-hidden p-3 select-none">
      {/* 1. Header Bar */}
      <div className="h-10 bg-[#1E3E62]/60 border border-slate-700/80 rounded-t-xl px-4 flex items-center justify-between text-xs mb-0 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#D4AF37]" />
          <span className="font-semibold text-stone-200">index.html</span>
          <span className="text-[10px] text-stone-400 bg-[#0B192C] px-2 py-0.5 rounded border border-slate-700 font-mono">
            {lines.length} dòng ({new Blob([code]).size} bytes)
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-lg transition text-xs font-medium border border-white/10"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Sao chép mã</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Code Body with Line Numbers */}
      <div className="flex-1 bg-[#070F1E] border border-slate-700/80 border-t-0 rounded-b-xl overflow-auto p-4 font-mono text-xs leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition">
                <td className="w-12 text-right pr-4 text-stone-600 select-none text-[11px] font-mono align-top">
                  {idx + 1}
                </td>
                <td className="text-stone-300 whitespace-pre font-mono align-top">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};
