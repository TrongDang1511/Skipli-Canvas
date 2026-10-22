import { SectionItemInfo, CardSiblingInfo } from '../types/editor.types';

/**
 * Đọc tên thông minh của một Section dựa vào tiêu đề H1/H2/H3 hoặc id bên trong
 */
function extractSectionName(el: HTMLElement, index: number): string {
  const tagName = el.tagName.toLowerCase();
  if (tagName === 'header') return 'Header / Navigation';
  if (tagName === 'footer') return 'Footer';

  // Tìm tiêu đề h1/h2/h3 đầu tiên
  const heading = el.querySelector('h1, h2, h3');
  if (heading && heading.textContent?.trim()) {
    const text = heading.textContent.trim().slice(0, 30);
    return `${text}${heading.textContent.trim().length > 30 ? '...' : ''}`;
  }

  // Tìm theo thuộc tính id
  if (el.id) {
    const idFormatted = el.id.replace(/[-_]/g, ' ');
    return idFormatted.charAt(0).toUpperCase() + idFormatted.slice(1);
  }

  // Tìm theo class phổ biến
  const cls = el.className?.toString().toLowerCase() || '';
  if (cls.includes('hero')) return 'Hero Banner';
  if (cls.includes('about')) return 'About Us';
  if (cls.includes('menu') || cls.includes('product')) return 'Products / Menu';
  if (cls.includes('testimonial') || cls.includes('review')) return 'Reviews / Testimonials';
  if (cls.includes('contact')) return 'Contact Us';

  return `Section ${index + 1}`;
}

/**
 * Quét toàn bộ các khối bố cục chính trên trang Iframe
 */
export function scanSections(doc: Document | null): SectionItemInfo[] {
  if (!doc || !doc.body) return [];

  // Tìm tất cả các thẻ header, section, footer ở cấp 1
  const elements = Array.from(
    doc.querySelectorAll('body > header, body > section, body > footer, body > main > section, body > div > section')
  ) as HTMLElement[];

  // Lọc loại bỏ các phần tử trùng lặp
  const uniqueElements = Array.from(new Set(elements));

  return uniqueElements.map((el, index) => {
    const id = el.id || `section-idx-${index}`;
    const tag = el.tagName.toLowerCase() as SectionItemInfo['tag'];
    const name = extractSectionName(el, index);
    const isHidden = el.style.display === 'none';

    return {
      id,
      index,
      name,
      tag,
      isHidden,
      element: el,
    };
  });
}

/**
 * Hoán đổi vị trí 2 Section trong DOM
 */
export function moveSectionInDOM(sections: SectionItemInfo[], fromIndex: number, toIndex: number): boolean {
  if (fromIndex < 0 || fromIndex >= sections.length || toIndex < 0 || toIndex >= sections.length) {
    return false;
  }

  const fromEl = sections[fromIndex]?.element;
  const toEl = sections[toIndex]?.element;
  if (!fromEl || !toEl || !fromEl.parentElement) return false;

  const parent = fromEl.parentElement;

  if (fromIndex < toIndex) {
    // Di chuyển xuống dưới: chèn sau toEl
    parent.insertBefore(fromEl, toEl.nextSibling);
  } else {
    // Di chuyển lên trên: chèn trước toEl
    parent.insertBefore(fromEl, toEl);
  }

  return true;
}

/**
 * Ẩn hoặc Hiện một Section
 */
export function toggleSectionVisibilityInDOM(el: HTMLElement): boolean {
  if (el.style.display === 'none') {
    el.style.display = '';
    return false; // Hiện
  } else {
    el.style.display = 'none';
    return true; // Ẩn
  }
}

/**
 * Phát hiện xem một element có phải là Thẻ con (Card) trong Grid hoặc Flexbox không
 */
export function detectCardSibling(el: HTMLElement, iframeRect: DOMRect): CardSiblingInfo | null {
  const parent = el.parentElement;
  if (!parent || parent === el.ownerDocument.body) return null;

  const win = el.ownerDocument.defaultView || window;
  const parentComputed = win.getComputedStyle(parent);
  const isGridOrFlex = parentComputed.display === 'grid' || parentComputed.display === 'flex';

  const siblings = Array.from(parent.children) as HTMLElement[];
  if (!isGridOrFlex || siblings.length < 2) return null;

  const index = siblings.indexOf(el);
  if (index === -1) return null;

  const rect = el.getBoundingClientRect();
  const top = iframeRect.top + rect.top + 6;
  const left = iframeRect.left + rect.right - 92; // Đặt ở góc trên bên phải của card

  return {
    element: el,
    container: parent,
    index,
    total: siblings.length,
    canMovePrev: index > 0,
    canMoveNext: index < siblings.length - 1,
    rect: {
      top: Math.max(10, Math.round(top)),
      left: Math.max(10, Math.round(left)),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };
}

/**
 * Hoán đổi vị trí thẻ con trong container Grid/Flex
 */
export function moveCardSiblingInDOM(el: HTMLElement, direction: 'prev' | 'next'): boolean {
  const parent = el.parentElement;
  if (!parent) return false;

  const siblings = Array.from(parent.children) as HTMLElement[];
  const currentIndex = siblings.indexOf(el);
  if (currentIndex === -1) return false;

  if (direction === 'prev' && currentIndex > 0) {
    const prevEl = siblings[currentIndex - 1];
    parent.insertBefore(el, prevEl);
    return true;
  }

  if (direction === 'next' && currentIndex < siblings.length - 1) {
    const nextEl = siblings[currentIndex + 1];
    parent.insertBefore(nextEl, el);
    return true;
  }

  return false;
}
