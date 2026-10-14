export interface HistoryEntry {
  html: string;
  label: string;
  timestamp: number;
}

/**
 * Quản lý lịch sử thao tác (Undo / Redo) cho Visual Canvas Editor
 * Hoạt động theo cơ chế Snapshot innerHTML với giới hạn kích thước (mặc định 20 bước)
 */
export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  /**
   * Đẩy snapshot trạng thái trước thay đổi vào stack hoàn tác
   */
  pushSnapshot(html: string, label: string): void {
    if (!html) return;

    // Tránh đẩy snapshot trùng lặp liên tiếp
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1].html === html) {
      return;
    }

    this.undoStack.push({
      html,
      label,
      timestamp: Date.now(),
    });

    // Giới hạn số bước tối đa (FIFO)
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    // Mỗi khi có thao tác mới, làm sạch nhánh Redo
    this.redoStack = [];
  }

  /**
   * Hoàn tác bước trước đó: pop từ undoStack, push currentHtml vào redoStack
   */
  undo(currentHtml: string): HistoryEntry | null {
    if (this.undoStack.length === 0) return null;

    const entryToRestore = this.undoStack.pop()!;

    if (currentHtml) {
      this.redoStack.push({
        html: currentHtml,
        label: entryToRestore.label,
        timestamp: Date.now(),
      });

      if (this.redoStack.length > this.maxSize) {
        this.redoStack.shift();
      }
    }

    return entryToRestore;
  }

  /**
   * Làm lại bước vừa hoàn tác: pop từ redoStack, push currentHtml vào undoStack
   */
  redo(currentHtml: string): HistoryEntry | null {
    if (this.redoStack.length === 0) return null;

    const entryToRestore = this.redoStack.pop()!;

    if (currentHtml) {
      this.undoStack.push({
        html: currentHtml,
        label: entryToRestore.label,
        timestamp: Date.now(),
      });

      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
    }

    return entryToRestore;
  }

  /**
   * Đặt lại toàn bộ lịch sử (ví dụ khi nạp mã HTML mới từ AI)
   */
  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }

  get lastUndoLabel(): string | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].label : null;
  }

  get lastRedoLabel(): string | null {
    return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1].label : null;
  }
}

/**
 * Trích xuất chuỗi innerHTML sạch từ Document Body, loại bỏ các artifact của inspector
 */
export function getCleanBodySnapshot(doc: Document): string {
  if (!doc.body) return '';

  const clone = doc.body.cloneNode(true) as HTMLElement;

  const badge = clone.querySelector('#skipli-inspector-badge');
  if (badge) badge.remove();

  clone.querySelectorAll('.skipli-hovered').forEach((el) => el.classList.remove('skipli-hovered'));
  clone.querySelectorAll('.skipli-selected').forEach((el) => el.classList.remove('skipli-selected'));
  clone.querySelectorAll('.skipli-text-editing').forEach((el) => {
    el.classList.remove('skipli-text-editing');
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('data-original-content');
  });

  // Gỡ bỏ bất kỳ contenteditable nào còn sót
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));

  return clone.innerHTML;
}
