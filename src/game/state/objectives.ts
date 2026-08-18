import type { Condition } from '@/data/types';
import type { GameStateData } from './gameStore';
import { evaluate } from '@/game/event/ConditionManager';

export interface Objective {
  conditions: Condition[];
  text: string;
}

export interface ObjectiveFile {
  objectives: Objective[];
}

/** 위에서부터 조건을 만족하는 첫 목표를 보여 준다 (진행이 앞선 것이 먼저) */
export function currentObjective(file: ObjectiveFile | null, state: GameStateData): string | null {
  if (!file) return null;
  return file.objectives.find((o) => evaluate(o.conditions, state))?.text ?? null;
}
