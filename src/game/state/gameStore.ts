'use client';

import { create } from 'zustand';
import type { EvidenceCategory, Note } from '@/data/types';

export interface HeldEvidence {
  id: string;
  category: EvidenceCategory;
}

export const MAX_MENTAL = 100;

export interface GameStateData {
  mental: number;
  inventory: string[];                        // item id
  evidence: HeldEvidence[];                   // evidence id + category
  characterClues: Record<string, string[]>;   // characterId → clue[]
  flags: Record<string, boolean>;
  notes: string[];                            // note id (본문은 public/data/notes.json)
  completedInteractions: string[];            // once: true 인 상호작용 기록
  currentChapter: string | null;
  currentEvent: string | null;
}

export interface GameStateActions {
  changeMental: (amount: number) => void;
  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  addEvidence: (id: string, category?: EvidenceCategory) => void;
  addCharacterClue: (characterId: string, clue: string) => void;
  setFlag: (key: string, value: boolean) => void;
  addNote: (noteId: string) => void;
  completeInteraction: (interactableId: string) => void;
  setChapter: (chapter: string | null) => void;
  setCurrentEvent: (eventId: string | null) => void;
  resetGame: () => void;
}

export type GameStore = GameStateData & GameStateActions;

const initialState: GameStateData = {
  mental: MAX_MENTAL,
  inventory: [],
  evidence: [],
  characterClues: {},
  flags: {},
  notes: [],
  completedInteractions: [],
  currentChapter: null,
  currentEvent: null,
};

const clampMental = (v: number) => Math.min(Math.max(v, 0), MAX_MENTAL);

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  changeMental: (amount) => set((s) => ({ mental: clampMental(s.mental + amount) })),

  addItem: (itemId) =>
    set((s) => (s.inventory.includes(itemId) ? s : { inventory: [...s.inventory, itemId] })),

  removeItem: (itemId) => set((s) => ({ inventory: s.inventory.filter((i) => i !== itemId) })),

  addEvidence: (id, category = 'case') =>
    set((s) => (s.evidence.some((e) => e.id === id) ? s : { evidence: [...s.evidence, { id, category }] })),

  addCharacterClue: (characterId, clue) =>
    set((s) => {
      const clues = s.characterClues[characterId] ?? [];
      if (clues.includes(clue)) return s;
      return { characterClues: { ...s.characterClues, [characterId]: [...clues, clue] } };
    }),

  setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),

  addNote: (noteId) => set((s) => (s.notes.includes(noteId) ? s : { notes: [...s.notes, noteId] })),

  completeInteraction: (interactableId) =>
    set((s) =>
      s.completedInteractions.includes(interactableId)
        ? s
        : { completedInteractions: [...s.completedInteractions, interactableId] },
    ),

  setChapter: (currentChapter) => set({ currentChapter }),
  setCurrentEvent: (currentEvent) => set({ currentEvent }),

  resetGame: () => set({ ...initialState }),
}));

/* ---- 셀렉터 훅: 컴포넌트는 필드를 직접 뒤지지 않는다 ---- */
export const useMental = () => useGameStore((s) => s.mental);
export const useInventory = () => useGameStore((s) => s.inventory);
export const useEvidence = () => useGameStore((s) => s.evidence);
export const useNotes = () => useGameStore((s) => s.notes);
export const useFlags = () => useGameStore((s) => s.flags);
export const useCharacterClues = () => useGameStore((s) => s.characterClues);
export const useCurrentChapter = () => useGameStore((s) => s.currentChapter);
export const useIsInteractionDone = (id: string) =>
  useGameStore((s) => s.completedInteractions.includes(id));

/** 노트 본문은 데이터에서 온다 — 스토어는 id만 들고 있는다 */
export const resolveNotes = (ids: string[], file: Record<string, Note>): Note[] =>
  ids.map((id) => file[id]).filter((n): n is Note => Boolean(n));
