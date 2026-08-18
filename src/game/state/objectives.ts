import type { Condition, Note } from '@/data/types';
import type { GameStateData } from './gameStore';
import { evaluate } from '@/game/event/ConditionManager';

export interface Objective {
  conditions: Condition[];
  text: string;
  /** 이동으로만 풀리는 진행 게이트 (엘리베이터 등) — 노트보다 우선해서 보여 준다 */
  navigation?: boolean;
}

export interface ObjectiveFile {
  objectives: Objective[];
}

export interface ObjectiveHint {
  label: string;
  text: string;
}

/**
 * 안내는 가능한 한 **사랑이 스스로 적은 기록**에서 나오게 한다.
 * - 이동으로만 풀리는 진행 게이트는 그대로 안내한다 (헤매게 두는 게 목적이 아니다)
 * - 그 외에는 가장 최근 기록 노트의 "다음 확인"을 보여 준다 (결과는 알려주지 않는다)
 */
export function currentObjective(
  file: ObjectiveFile | null,
  state: GameStateData,
  notes: Record<string, Note> = {},
): ObjectiveHint | null {
  const matched = file?.objectives.find((o) => evaluate(o.conditions, state)) ?? null;
  if (matched?.navigation) return { label: '오늘 할 일', text: matched.text };

  for (let i = state.notes.length - 1; i >= 0; i--) {
    const note = notes[state.notes[i]];
    if (note?.nextCheck) return { label: '기록 노트 · 다음 확인', text: note.nextCheck };
  }

  return matched ? { label: '오늘 할 일', text: matched.text } : null;
}
