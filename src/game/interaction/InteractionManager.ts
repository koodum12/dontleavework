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

/**
 * 오브젝트 **경계까지의** 거리.
 * 중심 간 거리로 재면 책상처럼 큰 오브젝트는 몸이 닿아 있어도 범위 밖으로 판정된다.
 */
const distanceToRect = (player: { x: number; y: number }, o: MapObject) => {
  const nearestX = Math.min(Math.max(player.x, o.x), o.x + o.w);
  const nearestY = Math.min(Math.max(player.y, o.y), o.y + o.h);
  return Math.hypot(nearestX - player.x, nearestY - player.y);
};

export interface NearestResult {
  object: MapObject;
  interactable: Interactable;
  distance: number;
}

/**
 * 매 프레임 가장 가까운 대상 1개만 고른다 (여러 개가 겹칠 때의 애매함 제거).
 * 이미 끝난 1회성 상호작용은 후보에서 빠진다.
 * 거리는 오브젝트 경계 기준이라, 책상 앞에 서면 바로 조사할 수 있다.
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
    const distance = distanceToRect(player, o);
    if (distance <= range && (!best || distance < best.distance)) {
      best = { object: o, interactable, distance };
    }
  }
  return best;
}
