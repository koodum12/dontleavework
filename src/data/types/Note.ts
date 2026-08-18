// gamd.md 9장 — 기록 노트
export interface Note {
  id: string;
  /** 챕터별 그룹핑용 */
  chapter?: string;
  fact: string;
  assumption?: string;
  nextCheck?: string;
}

export type NoteFile = Record<string, Note>;
