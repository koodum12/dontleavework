import type { EndingFile, EndingId, EndingMeta } from '@/data/types';
import type { GameStateData } from '@/game/state/gameStore';
import { evaluate, firstUnmet, unmetReason } from '@/game/event/ConditionManager';

/**
 * 엔딩 판정 — Day 3 의 ConditionManager 를 그대로 재사용한다 (평가기를 새로 만들지 않는다).
 * 평가 순서는 endings.json 의 배열 순서 = HIDDEN → TRUE → NORMAL → BAD.
 */
export function resolveEnding(file: EndingFile, state: GameStateData): EndingMeta | null {
  return file.endings.find((ending) => evaluate(ending.conditions, state)) ?? null;
}

export function findEnding(file: EndingFile, id: EndingId): EndingMeta | null {
  return file.endings.find((e) => e.id === id) ?? null;
}

/** 왜 이 엔딩이 아직 잠겨 있는지 (최종 선택지 잠금 표시용) */
export function endingLockReason(ending: EndingMeta, state: GameStateData): string | null {
  const unmet = firstUnmet(ending.conditions, state);
  return unmet ? unmetReason(unmet) : null;
}

export interface CollectionStats {
  evidenceCollected: number;
  evidenceTotal: number;
  memoryCollected: number;
  characterCluesCollected: number;
  characterTotal: number;
}

/** 엔딩 화면 수집률 */
export function collectionStats(
  state: GameStateData,
  evidenceTotal: number,
  characterTotal = 5,
): CollectionStats {
  return {
    evidenceCollected: state.evidence.length,
    evidenceTotal,
    memoryCollected: state.evidence.filter((e) => e.category === 'MEMORY').length,
    characterCluesCollected: Object.values(state.characterClues).filter((c) => c.length > 0).length,
    characterTotal,
  };
}
