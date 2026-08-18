'use client';

import type { ItemFile } from '@/data/types';
import { applyEffects } from '@/game/event/EventExecutor';
import { useEventStore } from '@/game/event/EventManager';
import { useGameStore } from '@/game/state/gameStore';

export type ConsumeItemResult = 'ok' | 'unknown-item' | 'not-usable';

/** 아이템 사용 — 효과는 items.json 에 정의된 데이터로만 결정된다 (React 훅이 아니다) */
export function consumeItem(itemId: string, itemFile: ItemFile): ConsumeItemResult {
  const item = itemFile[itemId];
  if (!item) {
    console.warn(`[consumeItem] 알 수 없는 아이템: ${itemId}`);
    return 'unknown-item';
  }
  if (!item.onUseEffects?.length && !item.onUseEvent) return 'not-usable';

  const game = useGameStore.getState();
  applyEffects(item.onUseEffects, game, game.mentalConfig);
  if (item.consumable) game.removeItem(itemId);
  if (item.onUseEvent) useEventStore.getState().start(item.onUseEvent);
  return 'ok';
}
