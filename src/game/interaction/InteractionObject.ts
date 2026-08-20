'use client';

import { useEventStore } from '@/game/event/EventManager';
import { gameStateSnapshot, useGameStore } from '@/game/state/gameStore';
import { evaluate } from '@/game/event/ConditionManager';
import type { NearestResult } from './InteractionManager';

/**
 * 씬에 배치된 상호작용 오브젝트의 런타임 동작.
 * 2D 캔버스 씬에서는 오브젝트가 React 컴포넌트가 아니라 맵 데이터라서,
 * "E 를 눌렀을 때 무슨 일이 일어나는가"만 여기서 책임진다.
 */
export type TriggerReason = 'ok' | 'traveled' | 'locked' | 'no-event' | 'already-running' | 'missing-event';

export interface TriggerResult {
  reason: TriggerReason;
  message?: string;
}

export function triggerInteraction(target: NearestResult | null): TriggerResult {
  if (!target) return { reason: 'no-event' };
  const { interactable } = target;
  if (interactable.travel) {
    const state = gameStateSnapshot();
    const blocker = interactable.travel.blocks?.find((block) => evaluate(block.conditions, state));
    if (blocker) {
      return {
        reason: 'locked',
        message: blocker.lockedText,
      };
    }
    if (!evaluate(interactable.travel.conditions, state)) {
      return {
        reason: 'locked',
        message: interactable.travel.lockedText ?? '아직 이쪽으로 갈 수 없다.',
      };
    }
    useGameStore.getState().travelTo(interactable.travel.to, interactable.travel.spawn);
    if (interactable.once) useGameStore.getState().completeInteraction(interactable.id);
    return { reason: 'traveled' };
  }

  if (!interactable.eventId) return { reason: 'no-event' };

  const started = useEventStore.getState().start(interactable.eventId);
  if (!started) {
    return { reason: useEventStore.getState().current ? 'already-running' : 'missing-event' };
  }

  // 1회성 상호작용은 실행 즉시 완료 처리 → 다음 프레임부터 후보에서 빠진다
  if (interactable.once) useGameStore.getState().completeInteraction(interactable.id);
  return { reason: 'ok' };
}
