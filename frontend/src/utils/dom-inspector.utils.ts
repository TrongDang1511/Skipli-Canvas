/**
 * Trả về tên hiển thị tiếng Việt ngắn gọn, thân thiện theo loại thẻ HTML hoặc vai trò CSS
 */
export function getElementTagLabel(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();

  // Nhận diện theo thẻ tiêu đề
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    return `Heading (${tagName.toUpperCase()})`;
  }

  // Nhận diện theo văn bản
  if (tagName === 'p') return 'Paragraph (P)';
  if (tagName === 'span') return 'Text (Span)';
  if (tagName === 'a') return 'Link (A)';
  if (tagName === 'button') return 'Button';

  // Nhận diện theo phương tiện
  if (tagName === 'img') return 'Image (IMG)';
  if (tagName === 'svg') return 'Icon (SVG)';
  if (tagName === 'video') return 'Video';

  // Nhận diện theo khối bố cục
  if (tagName === 'section') return 'Section';
  if (tagName === 'header') return 'Header';
  if (tagName === 'footer') return 'Footer';
  if (tagName === 'nav') return 'Navbar (Nav)';

  // Nhận diện theo class phổ biến
  const className = element.className?.toString().toLowerCase() || '';
  if (className.includes('card')) return 'Card';
  if (className.includes('grid')) return 'Grid';
  if (className.includes('container')) return 'Container';

  return `Element (${tagName.toUpperCase()})`;
}

/**
 * Dọn sạch các class, thẻ style, thẻ badge do Inspector chèn vào
 * Đồng thời loại bỏ thẻ style khổng lồ do runtime của Tailwind CDN tự động tiêm vào,
 * đảm bảo mã HTML lưu lên S3 thu nhỏ từ ~98KB về ~15-20KB, không bị cắt cụt ký tự.
 */
export function cleanInspectorArtifacts(doc: Document): string {
  // 1. Dọn dẹp trạng thái highlight trên live DOM để không còn viền inspector
  const hoveredEls = doc.querySelectorAll('.skipli-hovered');
  hoveredEls.forEach((el) => el.classList.remove('skipli-hovered'));

  const selectedEls = doc.querySelectorAll('.skipli-selected');
  selectedEls.forEach((el) => el.classList.remove('skipli-selected'));

  const undoEls = doc.querySelectorAll('.skipli-undo-highlight');
  undoEls.forEach((el) => el.classList.remove('skipli-undo-highlight'));

  const editingEls = doc.querySelectorAll('.skipli-text-editing');
  editingEls.forEach((el) => {
    el.classList.remove('skipli-text-editing');
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('data-original-content');
  });

  const contentEditables = doc.querySelectorAll('[contenteditable]');
  contentEditables.forEach((el) => el.removeAttribute('contenteditable'));

  // 2. Clone toàn bộ tài liệu HTML để bóc tách mã nguồn xuất bản mà KHÔNG làm giật giao diện iframe đang xem
  const clone = doc.documentElement.cloneNode(true) as HTMLElement;

  // Gỡ bỏ thẻ style, badge và toast của inspector trên bản clone
  clone.querySelector('#skipli-inspector-styles')?.remove();
  clone.querySelector('#skipli-inspector-badge')?.remove();
  clone.querySelector('#skipli-preview-toast-container')?.remove();
  clone.querySelector('#skipli-preview-guard')?.remove();

  // Gỡ bỏ thuộc tính chế độ editor trên thẻ <html> và class trạng thái trên <body>
  clone.removeAttribute('data-skipli-mode');
  const cloneBody = clone.querySelector('body') || (clone.tagName.toLowerCase() === 'body' ? clone : null);
  if (cloneBody) {
    cloneBody.classList.remove('skipli-visual-edit-active', 'skipli-preview-active');
    if (cloneBody.classList.length === 0) {
      cloneBody.removeAttribute('class');
    }
  }

  // 3. Phương án 1: Bóc tách và loại bỏ triệt để thẻ <style> do runtime của cdn.tailwindcss.com tự động tiêm vào
  // Giúp thu nhỏ dung lượng HTML từ ~98KB về ~15-20KB, ngăn GoClaw web_fetch bị tràn giới hạn 60.000 ký tự.
  // Khi người dùng xem trang hoặc tải file về máy, cdn.tailwindcss.com sẽ tự động phân tích class và biên dịch lại siêu tốc (~5ms).
  const styleTags = clone.querySelectorAll('style');
  styleTags.forEach((styleEl) => {
    const css = styleEl.textContent || '';
    const isTailwindRuntime =
      css.includes('tailwindcss') ||
      css.includes('--tw-border-spacing-x') ||
      css.includes('--tw-ring-offset-shadow') ||
      css.includes('--tw-pan-x') ||
      (css.includes('--tw-') && css.includes('*,::after,::before'));

    if (isTailwindRuntime) {
      styleEl.remove();
    }
  });

  // 4. Trả về toàn bộ chuỗi HTML sạch
  return '<!DOCTYPE html>\n' + clone.outerHTML;
}

