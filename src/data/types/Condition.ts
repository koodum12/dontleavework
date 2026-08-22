// gamd.md 11장 / day3 §6 — 조건 / 분기 시스템
export type EvidenceCategory = 'MEMORY' | 'character' | 'case';

export type Condition =
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'current_chapter'; value: string }
  | { type: 'current_chapter_in'; values: string[] }
  | { type: 'evidence_count'; category?: EvidenceCategory; min: number }
  | { type: 'character_clue_count'; min: number }   // 서로 다른 인물 수
  | { type: 'has_item'; itemId: string }
  | { type: 'has_evidence'; evidenceId: string }
  | { type: 'mental_below'; value: number }
  | { type: 'mental_above'; value: number };
