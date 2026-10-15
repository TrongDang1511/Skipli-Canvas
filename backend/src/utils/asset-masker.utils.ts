export interface MaskedAssetResult {
  maskedHtml: string;
  assetMap: Map<string, string>;
}

/**
 * Quét toàn bộ các link ảnh (URL MinIO S3, External CDN, Image links) trong HTML
 * và thay thế bằng các token ngắn __SKIPLI_ASSET_1__, __SKIPLI_ASSET_2__,...
 * Giúp tiết kiệm hàng nghìn token và bảo vệ 100% link ảnh người dùng không bị AI ghi đè.
 */
export function maskHtmlAssets(html: string): MaskedAssetResult {
  if (!html || !html.trim()) {
    return { maskedHtml: html, assetMap: new Map() };
  }

  const assetMap = new Map<string, string>(); // token -> originalUrl
  const urlToTokenMap = new Map<string, string>(); // originalUrl -> token
  let counter = 1;

  // Regex 1: Quét tất cả thẻ <img ... src="URL" ...>
  // Regex 2: Quét CSS background-image: url("URL") hoặc background: ... url("URL")
  const imgTagRegex = /<img\b([^>]*?)\bsrc=(["'])(https?:\/\/[^\s"'()]+)\2([^>]*?)>/gi;
  const cssUrlRegex = /url\(\s*(['"]?)(https?:\/\/[^\s"'()]+)\1\s*\)/gi;

  const isExcludedNonImage = (url: string): boolean => {
    const lower = url.toLowerCase();
    // Bỏ qua script JS
    if (lower.endsWith('.js') || lower.includes('.js?') || lower.includes('.min.js')) return true;
    // Bỏ qua CSS
    if (lower.endsWith('.css') || lower.includes('.css?')) return true;
    // Bỏ qua web fonts
    if (
      lower.endsWith('.woff') ||
      lower.endsWith('.woff2') ||
      lower.endsWith('.ttf') ||
      lower.endsWith('.otf') ||
      lower.endsWith('.eot') ||
      lower.includes('fonts.gstatic.com') ||
      lower.includes('fonts.googleapis.com')
    ) {
      return true;
    }
    // Bỏ qua các framework CDN quen thuộc
    if (lower.includes('cdn.tailwindcss.com') || lower.includes('unpkg.com/lucide')) return true;

    return false;
  };

  const getOrCreateToken = (url: string): string => {
    let token = urlToTokenMap.get(url);
    if (!token) {
      token = `__SKIPLI_ASSET_${counter++}__`;
      urlToTokenMap.set(url, token);
      assetMap.set(token, url);
    }
    return token;
  };

  // Bước 1: Mask trong các thẻ <img>
  let step1Html = html.replace(imgTagRegex, (fullMatch, before, quote, url, after) => {
    if (isExcludedNonImage(url)) {
      return fullMatch;
    }
    const token = getOrCreateToken(url);
    return `<img${before}src=${quote}${token}${quote}${after}>`;
  });

  // Bước 2: Mask trong CSS url(...)
  const maskedHtml = step1Html.replace(cssUrlRegex, (fullMatch, quote, url) => {
    if (isExcludedNonImage(url)) {
      return fullMatch;
    }
    const token = getOrCreateToken(url);
    return `url(${quote}${token}${quote})`;
  });

  return { maskedHtml, assetMap };
}

/**
 * Phục hồi các token __SKIPLI_ASSET_X__ trong mã HTML mới do AI sinh ra
 * trở lại thành URL ảnh thật (MinIO S3 / CDN) của người dùng.
 */
export function unmaskHtmlAssets(html: string, assetMap: Map<string, string>): string {
  if (!html || !assetMap || assetMap.size === 0) {
    return html;
  }

  let restoredHtml = html;
  for (const [token, originalUrl] of assetMap.entries()) {
    restoredHtml = restoredHtml.split(token).join(originalUrl);
  }

  return restoredHtml;
}
