'use client';

import { create } from 'zustand';
import type { EndingId, EvidenceCategory, MentalConfig } from '@/data/types';

export interface HeldEvidence {
  id: string;
  category: EvidenceCategory;
}

export interface GameStateData {
  mental: number;
  inventory: string[];                        // item id
  evidence: HeldEvidence[];                   // evidence id + category
  characterClues: Record<string, string[]>;   // characterId → clue[]
  flags: Record<string, boolean>;
  notes: string[];                            // note id (본문은 public/data/notes.json)
  messages: string[];                         // 받은 문자 id
  photos: string[];                           // 확보한 사진 id
  unreadMessages: number;
  completedInteractions: string[];            // once: true 인 상호작용 기록
  currentChapter: string | null;
  currentEvent: string | null;
  /** 도달한 엔딩 (엔딩 화면 표시용) */
  ending: EndingId | null;
}

export interface GameStateActions {
  changeMental: (amount: number) => void;
  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  addEvidence: (id: string, category?: EvidenceCategory) => void;
  addCharacterClue: (characterId: string, clue: string) => void;
  setFlag: (key: string, value: boolean) => void;
  addNote: (noteId: string) => void;
  receiveMessage: (messageId: string) => void;
  markMessagesRead: () => void;
  addPhoto: (photoId: string) => void;
  completeInteraction: (interactableId: string) => void;
  setChapter: (chapter: string | null) => void;
  setCurrentEvent: (eventId: string | null) => void;
  setEnding: (ending: EndingId | null) => void;
  setMentalConfig: (config: MentalConfig) => void;
  resetGame: () => void;
}

export type GameStore = GameStateData & GameStateActions & { mentalConfig: MentalConfig | null };

export const DEFAULT_MAX_MENTAL = 100;

const initialState: GameStateData = {
  mental: DEFAULT_MAX_MENTAL,
  inventory: [],
  evidence: [],
  characterClues: {},
  flags: {},
  notes: [],
  messages: [],
  photos: [],
  unreadMessages: 0,
  completedInteractions: [],
  currentChapter: null,
  currentEvent: null,
  ending: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  mentalConfig: null,

  changeMental: (amount) =>
    set((s) => {
      const max = s.mentalConfig?.max ?? DEFAULT_MAX_MENTAL;
      return { mental: Math.min(Math.max(s.mental + amount, 0), max) };
    }),

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

  receiveMessage: (messageId) =>
    set((s) =>
      s.messages.includes(messageId)
        ? s
        : { messages: [...s.messages, messageId], unreadMessages: s.unreadMessages + 1 },
    ),

  markMessagesRead: () => set((s) => (s.unreadMessages === 0 ? s : { unreadMessages: 0 })),

  addPhoto: (photoId) => set((s) => (s.photos.includes(photoId) ? s : { photos: [...s.photos, photoId] })),

  completeInteraction: (interactableId) =>
    set((s) =>
      s.completedInteractions.includes(interactableId)
        ? s
        : { completedInteractions: [...s.completedInteractions, interactableId] },
    ),

  setChapter: (currentChapter) => set({ currentChapter }),
  setCurrentEvent: (currentEvent) => set({ currentEvent }),
  setEnding: (ending) => set({ ending }),

  setMentalConfig: (mentalConfig) =>
    set({ mentalConfig, mental: get().mental === DEFAULT_MAX_MENTAL ? mentalConfig.start : get().mental }),

  resetGame: () => set({ ...initialState, mental: get().mentalConfig?.start ?? DEFAULT_MAX_MENTAL }),
}));

/* ---- 셀렉터 훅: 컴포넌트는 필드를 직접 뒤지지 않는다 ---- */
export const useMental = () => useGameStore((s) => s.mental);
export const useMentalConfig = () => useGameStore((s) => s.mentalConfig);
export const useInventory = () => useGameStore((s) => s.inventory);
export const useEvidence = () => useGameStore((s) => s.evidence);
export const useNotes = () => useGameStore((s) => s.notes);
export const useFlags = () => useGameStore((s) => s.flags);
export const useCharacterClues = () => useGameStore((s) => s.characterClues);
export const useMessages = () => useGameStore((s) => s.messages);
export const usePhotos = () => useGameStore((s) => s.photos);
export const useUnreadMessages = () => useGameStore((s) => s.unreadMessages);
export const useCurrentChapter = () => useGameStore((s) => s.currentChapter);
export const useEnding = () => useGameStore((s) => s.ending);

/** 조건 판정 등 순수 함수에 넘길 스냅샷 */
export const gameStateSnapshot = (): GameStateData => {
  const s = useGameStore.getState();
  return {
    mental: s.mental,
    inventory: s.inventory,
    evidence: s.evidence,
    characterClues: s.characterClues,
    flags: s.flags,
    notes: s.notes,
    messages: s.messages,
    photos: s.photos,
    unreadMessages: s.unreadMessages,
    completedInteractions: s.completedInteractions,
    currentChapter: s.currentChapter,
    currentEvent: s.currentEvent,
    ending: s.ending,
  };
};
