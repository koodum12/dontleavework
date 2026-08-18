import type { Condition } from './Condition';
import type { EvidenceCategory } from './Condition';

export type EventType =
  | 'dialogue' | 'choice' | 'interaction' | 'mentalChange'
  | 'itemGet' | 'itemUse' | 'evidenceGet' | 'noteAdd'
  | 'flagSet' | 'condition' | 'branch' | 'ending';

export type EndingId = 'true' | 'hidden' | 'normal' | 'bad';

/** JSON 에 그대로 쓰이는 효과 형태 (day2 §6 예시 기준) */
export type EventEffect =
  | { type: 'mentalChange'; amount: number }
  | { type: 'itemGet'; id: string }
  | { type: 'itemRemove'; id: string }
  | { type: 'evidenceGet'; id: string; category?: EvidenceCategory }
  | { type: 'characterClue'; characterId: string; clue: string }
  | { type: 'noteAdd'; id: string }
  | { type: 'flagSet'; key: string; value: boolean };

export interface Choice {
  text: string;
  next?: string;
  conditions?: Condition[];   // 조건 미충족 시 비활성/숨김
  /** 조건 미충족 시 숨길지(true) 비활성만 할지(false, 기본) */
  hideIfLocked?: boolean;
  effects?: EventEffect[];
}

export interface Branch {
  conditions: Condition[];
  next: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  speaker?: string;
  text?: string;
  choices?: Choice[];
  effects?: EventEffect[];    // mental / item / evidence / note / flag
  next?: string;              // 선택지 없을 때 다음 이벤트
  /** type === 'branch' — 위에서부터 조건을 만족하는 첫 분기로 이동 */
  branches?: Branch[];
  /** 모든 branch 조건이 실패했을 때 */
  fallback?: string;
  /** type === 'ending' */
  ending?: EndingId;
}

export interface EventFile {
  events: GameEvent[];
}
