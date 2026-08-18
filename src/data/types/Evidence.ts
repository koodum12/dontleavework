import type { EvidenceCategory } from './Condition';

export interface Evidence {
  id: string;
  category: EvidenceCategory;
  name: string;
  detail?: string;
  /** category === 'character' 일 때 어떤 인물의 단서인가 */
  characterId?: string;
}

export type { EvidenceCategory };

export type EvidenceFile = Record<string, Evidence>;
