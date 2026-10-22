export function isImageTarget(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() === 'img') return true;

  // Kiểm tra ảnh nền trong inline style
  if (el.style.backgroundImage && el.style.backgroundImage !== 'none' && el.style.backgroundImage.includes('url(')) {
    return true;
  }

  // Kiểm tra computed style cho các khối bố cục
  const tagName = el.tagName.toLowerCase();
  if (['section', 'header', 'div', 'main', 'article'].includes(tagName)) {
    try {
      const win = el.ownerDocument.defaultView || window;
      const computed = win.getComputedStyle(el);
      if (computed.backgroundImage && computed.backgroundImage !== 'none' && computed.backgroundImage.includes('url(')) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export function extractImageSource(el: HTMLElement): { type: 'img' | 'background'; url: string } {
  if (el.tagName.toLowerCase() === 'img') {
    return {
      type: 'img',
      url: (el as HTMLImageElement).src || el.getAttribute('src') || '',
    };
  }

  // Trích xuất URL từ background-image
  const win = el.ownerDocument.defaultView || window;
  const bg = el.style.backgroundImage || win.getComputedStyle(el).backgroundImage || '';
  const match = bg.match(/url\(['"]?(.*?)['"]?\)/i);
  return {
    type: 'background',
    url: match ? match[1] : '',
  };
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function applyImageToElement(el: HTMLElement, newUrl: string) {
  if (el.tagName.toLowerCase() === 'img') {
    el.setAttribute('src', newUrl);
    (el as HTMLImageElement).src = newUrl;
  } else {
    el.style.backgroundImage = `url("${newUrl}")`;
  }
}
