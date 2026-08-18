'use client';

import { useEventStore } from '@/game/event/EventManager';
import { useGameStore } from '@/game/state/gameStore';
import type { NearestResult } from './InteractionManager';

/**
 * 씬에 배치된 상호작용 오브젝트의 런타임 동작.
 * 2D 캔버스 씬에서는 오브젝트가 React 컴포넌트가 아니라 맵 데이터라서,
 * "E 를 눌렀을 때 무슨 일이 일어나는가"만 여기서 책임진다.
 */
export type TriggerReason = 'ok' | 'no-event' | 'already-running' | 'missing-event';

export function triggerInteraction(target: NearestResult | null): TriggerReason {
  if (!target) return 'no-event';
  const { interactable } = target;
  if (!interactable.eventId) return 'no-event';

  const started = useEventStore.getState().start(interactable.eventId);
  if (!started) return useEventStore.getState().current ? 'already-running' : 'missing-event';

  // 1회성 상호작용은 실행 즉시 완료 처리 → 다음 프레임부터 후보에서 빠진다
  if (interactable.once) useGameStore.getState().completeInteraction(interactable.id);
  return 'ok';
}
