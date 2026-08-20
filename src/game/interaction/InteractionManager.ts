import type { GameMap, MapNpc, MapObject, Rect, TravelTarget } from '@/data/types';
import { INTERACT_RANGE } from './constants';

/** 맵 위에서 E 로 조준할 수 있는 것 — 가구이거나 사람이다 */
export type Interactive = MapObject | MapNpc;

/** 씬에 놓여 상호작용 가능한 대상 (gamd.md 5장) */
export interface Interactable {
  id: string;
  eventId?: string;
  travel?: TravelTarget;
  prompt: string;
  once: boolean;
  /** 가구는 조사하고 사람에게는 말을 건다 — 프롬프트 동사가 갈린다 */
  kind: 'object' | 'npc';
}

const isNpc = (o: Interactive): o is MapNpc => 'characterId' in o;

export const toInteractable = (o: Interactive): Interactable => ({
  id: o.id,
  eventId: o.eventId,
  travel: isNpc(o) ? undefined : o.travel,
  prompt: o.label,
  once: o.once ?? false,
  kind: isNpc(o) ? 'npc' : 'object',
});

/** 가구와 사람을 한 목록으로 — 조준은 거리로만 정한다 */
export const interactives = (map: GameMap): Interactive[] => [
  ...map.objects,
  ...(map.npcs ?? []),
];

/**
 * 오브젝트 **경계까지의** 거리.
 * 중심 간 거리로 재면 책상처럼 큰 오브젝트는 몸이 닿아 있어도 범위 밖으로 판정된다.
 */
const distanceToRect = (player: { x: number; y: number }, o: Rect) => {
  const nearestX = Math.min(Math.max(player.x, o.x), o.x + o.w);
  const nearestY = Math.min(Math.max(player.y, o.y), o.y + o.h);
  return Math.hypot(nearestX - player.x, nearestY - player.y);
};

export interface NearestResult {
  object: Interactive;
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
  for (const o of interactives(map)) {
    const interactable = toInteractable(o);
    if (interactable.once && completed.includes(o.id)) continue;
    const distance = distanceToRect(player, o);
    if (distance <= range && (!best || distance < best.distance)) {
      best = { object: o, interactable, distance };
    }
  }
  return best;
}
