import type { EvidenceCategory } from './Condition';

export interface Evidence {
  id: string;
  category: EvidenceCategory;
  name: string;
  detail?: string;
  /** 이 증거가 가리키는 인물 (인물 단서 집계용) */
  relatedCharacter?: string;
  /** 획득 챕터 — 목록 그룹핑용 */
  chapter?: string;
}

export type { EvidenceCategory };

export type EvidenceFile = Record<string, Evidence>;
