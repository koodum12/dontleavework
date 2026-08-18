// gamd.md 9장 — 기록 노트
export interface Note {
  id: string;
  fact: string;
  assumption?: string;
  nextCheck?: string;
}

export type NoteFile = Record<string, Note>;
