import type { EventEffect, GameEvent, MentalConfig } from '@/data/types';
import type { GameStateActions } from '@/game/state/gameStore';
import { resolveDelta } from '@/game/state/mental';

/** effects 배열을 순회하며 GameState 액션을 호출한다 */
export function applyEffects(
  effects: EventEffect[] | undefined,
  state: GameStateActions,
  mentalConfig: MentalConfig | null = null,
) {
  if (!effects) return;
  for (const effect of effects) {
    switch (effect.type) {
      case 'mentalChange':
        // 수치를 직접 쓰거나 mental.json 에 이름으로 정의된 값을 참조한다
        state.changeMental(effect.amount ?? resolveDelta(effect.delta ?? '', mentalConfig));
        break;
      case 'itemGet':
        state.addItem(effect.id);
        break;
      case 'itemRemove':
        state.removeItem(effect.id);
        break;
      case 'evidenceGet':
        state.addEvidence(effect.id, effect.category);
        break;
      case 'characterClue':
        state.addCharacterClue(effect.characterId, effect.clue);
        break;
      case 'noteAdd':
        state.addNote(effect.id);
        break;
      case 'flagSet':
        state.setFlag(effect.key, effect.value);
        break;
      case 'messageReceive':
        state.receiveMessage(effect.id);
        break;
      case 'photoGet':
        state.addPhoto(effect.id);
        break;
      case 'chapterSet':
        state.setChapter(effect.chapter);
        break;
      case 'travel':
        state.travelTo(effect.to, effect.spawn);
        break;
      default: {
        const unknown = effect as { type: string };
        console.warn(`[EventExecutor] 알 수 없는 effect type: ${unknown.type}`);
      }
    }
  }
}

/**
 * 이벤트 하나를 실행한다.
 * - 이벤트의 effects 를 GameState 에 적용하고
 * - 다음 이벤트 id 를 반환한다 (없으면 null → 체인 종료)
 */
export function executeEvent(
  event: GameEvent,
  state: GameStateActions,
  mentalConfig: MentalConfig | null = null,
): string | null {
  applyEffects(event.effects, state, mentalConfig);
  return event.next ?? null;
}

/** 선택지 실행 — 선택지 자체의 effects 를 적용하고 다음 id 를 반환 */
export function executeChoice(
  event: GameEvent,
  index: number,
  state: GameStateActions,
  mentalConfig: MentalConfig | null = null,
): string | null {
  const choice = event.choices?.[index];
  if (!choice) {
    console.warn(`[EventExecutor] ${event.id}: ${index}번 선택지가 없습니다.`);
    return null;
  }
  applyEffects(choice.effects, state, mentalConfig);
  return choice.next ?? null;
}
