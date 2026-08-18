import type { GameMap } from '@/data/types';
import type { Player } from '@/game/player/PlayerController';
import type { Camera } from './Camera';
import { PLAYER_SIZE, TILE, VIEW_HEIGHT, VIEW_WIDTH } from '@/game/interaction/constants';

/** Day 1은 색 사각형이면 충분하다. 스프라이트는 Day 4. */
const COLORS = {
  floor: '#23262c',
  grid: '#2b2f36',
  wall: '#4a5058',
  object: '#6b563c',
  objectSoft: '#7d6a4a',
  nearest: '#c8a25a',
  player: '#e0e4ea',
  facing: '#8fb7ff',
};

export interface RenderInput {
  map: GameMap;
  player: Player;
  camera: Camera;
  nearestObjectId?: string | null;
}

/** 바닥 → 벽 → 오브젝트 → 플레이어 순서로 그린다 */
export function render(ctx: CanvasRenderingContext2D, { map, player, camera, nearestObjectId }: RenderInput) {
  ctx.save();
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.translate(-camera.x, -camera.y);

  // 바닥
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, map.width, map.height);

  // 타일 격자 (공간감용)
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= map.width; x += TILE) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, map.height);
  }
  for (let y = 0; y <= map.height; y += TILE) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(map.width, y + 0.5);
  }
  ctx.stroke();

  // 벽
  ctx.fillStyle = COLORS.wall;
  for (const w of map.walls) ctx.fillRect(w.x, w.y, w.w, w.h);

  // 오브젝트
  for (const o of map.objects) {
    ctx.fillStyle = o.solid ? COLORS.object : COLORS.objectSoft;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    if (o.id === nearestObjectId) {
      ctx.strokeStyle = COLORS.nearest;
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
    }
  }

  // 플레이어
  const half = PLAYER_SIZE / 2;
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(player.x - half, player.y - half, PLAYER_SIZE, PLAYER_SIZE);

  // 바라보는 방향 표시 (Day 4 스프라이트 전까지의 임시 표기)
  ctx.fillStyle = COLORS.facing;
  const mark = 6;
  const offsets: Record<Player['facing'], [number, number]> = {
    up: [0, -half],
    down: [0, half - mark],
    left: [-half, 0],
    right: [half - mark, 0],
  };
  const [ox, oy] = offsets[player.facing];
  ctx.fillRect(player.x - mark / 2 + ox, player.y - mark / 2 + oy, mark, mark);

  ctx.restore();
}
