import { FC, useState, useRef, useEffect } from 'react';
import { ImageTargetInfo } from '../../../types/editor.types';
import { readImageFileAsDataUrl } from '../../../utils/image-replacer.utils';
import { cn } from '../../../utils/cn';
import {
  UploadCloud,
  Link,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  FileImage,
} from 'lucide-react';

interface ImageReplacerModalProps {
  isOpen: boolean;
  target: ImageTargetInfo | null;
  onClose: () => void;
  onConfirm: (newImageUrl: string) => void;
}

export const ImageReplacerModal: FC<ImageReplacerModalProps> = ({
  isOpen,
  target,
  onClose,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state mỗi khi mở modal mới
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl('');
      setUrlInput('');
      setSelectedFileName('');
      setErrorMessage('');
      setActiveTab('upload');
    }
  }, [isOpen]);

  if (!isOpen || !target) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setPreviewUrl(dataUrl);
      setSelectedFileName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
    } catch {
      setErrorMessage('Unable to read image file. Please try again.');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    setPreviewUrl(val);
    setErrorMessage('');
  };

  const handleApply = () => {
    const finalUrl = previewUrl.trim();
    if (!finalUrl) {
      setErrorMessage('Please select an image or enter an image URL.');
      return;
    }
    onConfirm(finalUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0B192C] text-slate-900 dark:text-stone-100 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto flex flex-col transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95">
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header Modal */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[#D4AF37]">
              <ImageIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Replace Image
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-stone-400">
                {target.type === 'img' ? 'Image element (<img>)' : 'Background image (background-image)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer',
              activeTab === 'upload'
                ? 'border-[#D4AF37] text-slate-950 dark:text-[#D4AF37] font-bold'
                : 'border-transparent text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-white'
            )}
          >
            <UploadCloud className="w-3.5 h-3.5 stroke-[2]" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={cn(
              'pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer',
              activeTab === 'url'
                ? 'border-[#D4AF37] text-slate-950 dark:text-[#D4AF37] font-bold'
                : 'border-transparent text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-white'
            )}
          >
            <Link className="w-3.5 h-3.5 stroke-[2]" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Body Form - Cho phép cuộn trơn tru trên màn hình di động */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain p-4 sm:p-5 flex flex-col gap-4">
          {activeTab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 dark:bg-[#112240]/40 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <UploadCloud className="w-5 h-5 stroke-[1.75] text-slate-500 dark:text-stone-300 group-hover:text-[#D4AF37]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-stone-200">
                  Click or drag image to upload
                </span>
                <span className="text-[11px] text-slate-400 dark:text-stone-400 mt-0.5">
                  Supports PNG, JPG, WEBP, SVG
                </span>

                {selectedFileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-[#D4AF37] text-[11px] rounded-md font-medium border border-amber-500/20">
                    <FileImage className="w-3 h-3 stroke-[2]" />
                    <span>{selectedFileName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-stone-300">
                Direct Image URL:
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={handleUrlChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#112240] border border-slate-200 dark:border-slate-700 rounded-lg text-base md:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Comparison */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Image
              </span>
              <div className="h-24 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {target.currentUrl ? (
                  <img
                    src={target.currentUrl}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">No image</span>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                New Preview
              </span>
              <div className="h-24 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="New Preview"
                    onError={() => setErrorMessage('Failed to load image preview from this URL.')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">No image selected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 pb-safe sm:pb-3 bg-slate-50 dark:bg-[#070F1E] border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-stone-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer text-center justify-center touch-manipulation"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!previewUrl}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-[#1E3E62] hover:bg-[#28507e] text-white dark:bg-[#1E3E62] dark:hover:bg-[#28507e] font-bold text-xs rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border border-[#16304d] dark:border-blue-400/30 touch-manipulation"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#D4AF37] dark:text-amber-300" />
            <span>Apply Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
