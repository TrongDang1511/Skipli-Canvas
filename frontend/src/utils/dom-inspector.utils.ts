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
 * Đảm bảo mã HTML khi lưu hoặc xuất bản 100% nguyên bản, không chứa rác code
 */
export function cleanInspectorArtifacts(doc: Document): string {
  // 1. Gỡ bỏ thẻ style của inspector
  const styleTag = doc.getElementById('skipli-inspector-styles');
  if (styleTag) {
    styleTag.remove();
  }

  // 2. Gỡ bỏ badge inspector và toast preview
  const badgeEl = doc.getElementById('skipli-inspector-badge');
  if (badgeEl) {
    badgeEl.remove();
  }

  const toastContainer = doc.getElementById('skipli-preview-toast-container');
  if (toastContainer) {
    toastContainer.remove();
  }

  const guardScript = doc.getElementById('skipli-preview-guard');
  if (guardScript) {
    guardScript.remove();
  }

  // 3. Xóa các class highlight trên toàn bộ elements
  const hoveredEls = doc.querySelectorAll('.skipli-hovered');
  hoveredEls.forEach((el) => el.classList.remove('skipli-hovered'));

  const selectedEls = doc.querySelectorAll('.skipli-selected');
  selectedEls.forEach((el) => el.classList.remove('skipli-selected'));

  const editingEls = doc.querySelectorAll('.skipli-text-editing');
  editingEls.forEach((el) => {
    el.classList.remove('skipli-text-editing');
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('data-original-content');
  });

  // Gỡ bỏ bất kỳ thẻ nào còn sót contenteditable
  const contentEditables = doc.querySelectorAll('[contenteditable]');
  contentEditables.forEach((el) => el.removeAttribute('contenteditable'));

  // 4. Trả về toàn bộ chuỗi HTML sạch
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
