
export enum ViewMode {
  SPLIT = 'SPLIT',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
}

export interface DocumentState {
  content: string;
  title: string;
}
