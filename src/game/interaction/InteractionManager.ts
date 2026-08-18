import type { GameMap, MapObject } from '@/data/types';
import { INTERACT_RANGE } from './constants';

/** 씬에 놓여 상호작용 가능한 대상 (gamd.md 5장) */
export interface Interactable {
  id: string;
  eventId?: string;
  prompt: string;
  once: boolean;
}

export const toInteractable = (o: MapObject): Interactable => ({
  id: o.id,
  eventId: o.eventId,
  prompt: o.label,
  once: o.once ?? false,
});

const center = (o: MapObject) => ({ x: o.x + o.w / 2, y: o.y + o.h / 2 });

export interface NearestResult {
  object: MapObject;
  interactable: Interactable;
  distance: number;
}

/**
 * 매 프레임 가장 가까운 대상 1개만 고른다 (여러 개가 겹칠 때의 애매함 제거).
 * 이미 끝난 1회성 상호작용은 후보에서 빠진다.
 */
export function findNearest(
  player: { x: number; y: number },
  map: GameMap,
  completed: readonly string[] = [],
  range = INTERACT_RANGE,
): NearestResult | null {
  let best: NearestResult | null = null;
  for (const o of map.objects) {
    const interactable = toInteractable(o);
    if (interactable.once && completed.includes(o.id)) continue;
    const c = center(o);
    const distance = Math.hypot(c.x - player.x, c.y - player.y);
    if (distance <= range && (!best || distance < best.distance)) {
      best = { object: o, interactable, distance };
    }
  }
  return best;
}
