export type CanvasEditorMode = 'preview' | 'visual_edit';

export interface InspectorBadgeInfo {
  tag: string;
  label: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface FloatingToolbarPosition {
  top: number;
  left: number;
  visible: boolean;
}

export interface TextColorOption {
  label: string;
  value: string;
  previewBg: string;
}

export interface ImageTargetInfo {
  element: HTMLElement;
  type: 'img' | 'background';
  currentUrl: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface ImageModalState {
  isOpen: boolean;
  target: ImageTargetInfo | null;
}

export interface SectionItemInfo {
  id: string;
  index: number;
  name: string;
  tag: 'section' | 'header' | 'footer' | 'nav' | 'div';
  isHidden: boolean;
  element: HTMLElement;
}

export interface CardSiblingInfo {
  element: HTMLElement;
  container: HTMLElement;
  index: number;
  total: number;
  canMovePrev: boolean;
  canMoveNext: boolean;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface VisualBridgeState {
  mode: CanvasEditorMode;
  isDirty: boolean;
  selectedElement: HTMLElement | null;
  hoveredElement: HTMLElement | null;
  badgeInfo: InspectorBadgeInfo | null;
  isEditingText: boolean;
  activeEditingElement: HTMLElement | null;
  toolbarPosition: FloatingToolbarPosition | null;
  imageTarget: ImageTargetInfo | null;
  isImageModalOpen: boolean;
  isSectionDrawerOpen: boolean;
  sectionsList: SectionItemInfo[];
  cardSiblingInfo: CardSiblingInfo | null;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  lastUndoLabel: string | null;
  lastRedoLabel: string | null;
}
