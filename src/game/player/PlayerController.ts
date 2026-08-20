import type { Facing, GameMap, Rect } from '@/data/types';
import { PLAYER_SIZE, PLAYER_SPEED } from '@/game/interaction/constants';

export type { Facing };

export interface Player {
  x: number; // 중심 좌표
  y: number;
  facing: Facing;
}

export const createPlayer = (map: GameMap, spawn = map.spawn): Player => ({
  x: spawn.x,
  y: spawn.y,
  facing: 'down',
});

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const playerRect = (x: number, y: number): Rect => ({
  x: x - PLAYER_SIZE / 2,
  y: y - PLAYER_SIZE / 2,
  w: PLAYER_SIZE,
  h: PLAYER_SIZE,
});

/** 벽 + solid 오브젝트 + solid NPC (사람도 몸으로 막는다) */
export const solidRects = (map: GameMap): Rect[] => [
  ...map.walls,
  ...map.objects.filter((o) => o.solid),
  ...(map.npcs ?? []).filter((n) => n.solid),
];

const blocked = (x: number, y: number, solids: Rect[]) => {
  const rect = playerRect(x, y);
  return solids.some((s) => overlaps(rect, s));
};

/**
 * 축 분리(axis-separated) AABB 이동.
 * x 와 y 를 따로 시도해야 벽에 붙어서도 스치는 방향으로 계속 움직인다.
 */
export function movePlayer(
  player: Player,
  move: { x: number; y: number },
  dt: number,
  map: GameMap,
  solids: Rect[] = solidRects(map),
): Player {
  const dx = move.x * PLAYER_SPEED * dt;
  const dy = move.y * PLAYER_SPEED * dt;

  let { x, y } = player;
  const half = PLAYER_SIZE / 2;

  if (dx !== 0) {
    const nx = Math.min(Math.max(x + dx, half), map.width - half);
    if (!blocked(nx, y, solids)) x = nx;
  }
  if (dy !== 0) {
    const ny = Math.min(Math.max(y + dy, half), map.height - half);
    if (!blocked(x, ny, solids)) y = ny;
  }

  let facing = player.facing;
  if (Math.abs(move.x) > Math.abs(move.y)) {
    if (move.x !== 0) facing = move.x < 0 ? 'left' : 'right';
  } else if (move.y !== 0) {
    facing = move.y < 0 ? 'up' : 'down';
  }

  return { x, y, facing };
}
