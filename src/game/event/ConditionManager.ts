import type { Condition } from '@/data/types';
import type { GameStateData } from '@/game/state/gameStore';

/** 조건 판정은 순수 함수로만 한다 — 엔딩 분기가 여기 걸려 있다 */
export function evaluateOne(condition: Condition, state: GameStateData): boolean {
  switch (condition.type) {
    case 'flag':
      return (state.flags[condition.key] ?? false) === condition.value;

    case 'current_chapter':
      return state.currentChapter === condition.value;

    case 'current_chapter_in':
      return condition.values.includes(state.currentChapter ?? '');

    case 'evidence_count': {
      const list = condition.category
        ? state.evidence.filter((e) => e.category === condition.category)
        : state.evidence;
      return list.length >= condition.min;
    }

    // 진 엔딩 조건이 "서로 다른 인물 2명 이상"이라 인물 수로 센다 (단서 총합이 아니다)
    case 'character_clue_count': {
      const characters = Object.entries(state.characterClues)
        .filter(([, clues]) => clues.length > 0)
        .map(([id]) => id);
      return characters.length >= condition.min;
    }

    case 'has_item':
      return state.inventory.includes(condition.itemId);

    case 'has_evidence':
      return state.evidence.some((e) => e.id === condition.evidenceId);

    case 'mental_below':
      return state.mental < condition.value;

    case 'mental_above':
      return state.mental > condition.value;

    default: {
      const unknown = condition as { type: string };
      console.warn(`[ConditionManager] 알 수 없는 조건: ${unknown.type}`);
      return false;
    }
  }
}

/** 모든 조건을 만족해야 true (AND). 조건이 없으면 항상 true */
export function evaluate(conditions: Condition[] | undefined, state: GameStateData): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateOne(c, state));
}

/** 조건을 만족하지 못한 첫 이유 (선택지 비활성 사유 표시용) */
export function firstUnmet(conditions: Condition[] | undefined, state: GameStateData): Condition | null {
  if (!conditions) return null;
  return conditions.find((c) => !evaluateOne(c, state)) ?? null;
}

/** 조건을 "무엇을 갖추면 되는가"로 읽히게 (엔딩 체크리스트용) */
export function conditionLabel(condition: Condition): string {
  switch (condition.type) {
    case 'flag':
      return condition.value
        ? FLAG_LABELS[condition.key] ?? condition.key
        : `${FLAG_LABELS[condition.key] ?? condition.key}하지 않음`;
    case 'current_chapter':
      return `${condition.value} 진행 중`;
    case 'current_chapter_in':
      return `${condition.values.join(', ')} 중 하나 진행 중`;
    case 'evidence_count':
      return `${condition.category === 'MEMORY' ? 'MEMORY 증거' : condition.category === 'character' ? '인물 증거' : '증거'} ${condition.min}개 이상`;
    case 'character_clue_count':
      return `서로 다른 인물 단서 ${condition.min}명분`;
    case 'has_item':
      return '필요한 물건 확보';
    case 'has_evidence':
      return '근거 증거 확보';
    case 'mental_below':
      return `정신력 ${condition.value} 미만`;
    case 'mental_above':
      return `정신력 ${condition.value} 초과`;
    default:
      return '조건';
  }
}

/** 플래그 → 사람이 읽는 말. 없으면 키를 그대로 쓴다 */
const FLAG_LABELS: Record<string, string> = {
  intrusion_evidence: '침입 · 열람 · 출력 기록 1개 이상',
  accused_alone: '특정 인물을 단둘이 추궁',
  checked_cctv: 'CCTV 확인',
  checked_memory_01: 'MEMORY_01 조사',
  found_0213: '02:13 기록 발견',
  checked_network_log: '사내망 접속 기록 확보',
  recovered_deleted_note: '삭제된 메모 복구',
  recovered_voice_memo: '과거 음성 메모 복구',
  compared_clues: '여러 인물의 단서 비교',
  recovered_prememory: 'Evidence_PreMemory 복구',
  memory_deleted: 'MEMORY 삭제 후 퇴사',
};

export function unmetReason(condition: Condition): string {
  switch (condition.type) {
    case 'flag':
      return condition.value ? '아직 확인하지 못한 것이 있다.' : '이미 지나간 선택이다.';
    case 'current_chapter':
      return '지금 진행 중인 장에서는 선택할 수 없다.';
    case 'current_chapter_in':
      return '지금 진행 중인 장에서는 만날 수 없다.';
    case 'evidence_count':
      return `증거가 더 필요하다. (${condition.category ?? '전체'} ${condition.min}개 이상)`;
    case 'character_clue_count':
      return `서로 다른 인물의 단서가 ${condition.min}명분 필요하다.`;
    case 'has_item':
      return '필요한 물건이 없다.';
    case 'has_evidence':
      return '근거가 될 증거가 없다.';
    case 'mental_below':
      return '지금은 그렇게까지 몰려 있지 않다.';
    case 'mental_above':
      return '정신력이 부족하다.';
    default:
      return '조건을 만족하지 못했다.';
  }
}
