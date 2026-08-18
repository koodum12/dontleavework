// gamd.md 11장 — 조건 / 분기 시스템
export type EvidenceCategory = 'MEMORY' | 'character' | 'case';

export type Condition =
  | { type: 'evidence_count'; category?: EvidenceCategory; min: number }
  | { type: 'character_clue_count'; min: number }
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'has_item'; itemId: string }
  | { type: 'has_evidence'; evidenceId: string }
  | { type: 'mental'; min?: number; max?: number };
