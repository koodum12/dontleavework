import type { Condition } from './Condition';

export type EndingId = 'bad' | 'normal' | 'true' | 'hidden';

export interface EndingMeta {
  id: EndingId;
  name: string;
  summary: string;
  conditions: Condition[];
}

export interface EndingFile {
  /** 평가 순서대로 (HIDDEN → TRUE → NORMAL → BAD) */
  endings: EndingMeta[];
}
