import { describe, expect, it } from 'vitest';
import { createPlayer, movePlayer } from './PlayerController';
import { findNearest } from '@/game/interaction/InteractionManager';
import { computeCamera } from '@/game/render/Camera';
import { PLAYER_SPEED } from '@/game/interaction/constants';
import type { GameMap } from '@/data/types';

const map: GameMap = {
  id: 'test',
  name: '테스트 맵',
  palette: 'day',
  width: 1000,
  height: 800,
  spawn: { x: 100, y: 100 },
  walls: [{ x: 200, y: 0, w: 32, h: 800 }], // 세로 벽
  objects: [
    { id: 'desk', label: '책상', x: 400, y: 400, w: 96, h: 64, solid: true },
    { id: 'coffee', label: '커피', x: 100, y: 300, w: 24, h: 24, solid: false },
  ],
};

describe('플레이어 이동', () => {
  it('오른쪽으로 dt 만큼 이동한다', () => {
    const p = movePlayer(createPlayer(map), { x: 1, y: 0 }, 0.5, map);
    expect(p.x).toBeCloseTo(100 + PLAYER_SPEED * 0.5);
    expect(p.facing).toBe('right');
  });

  it('벽을 통과하지 못한다', () => {
    let p = createPlayer(map);
    for (let i = 0; i < 60; i++) p = movePlayer(p, { x: 1, y: 0 }, 0.05, map);
    expect(p.x).toBeLessThan(200); // 벽 왼쪽에서 멈춘다
  });

  it('벽에 붙어도 스치는 방향(y)으로는 계속 움직인다 — 축 분리 검사', () => {
    let p = createPlayer(map);
    for (let i = 0; i < 60; i++) p = movePlayer(p, { x: 1, y: 0 }, 0.05, map);
    const stuckX = p.x;
    const before = p.y;
    p = movePlayer(p, { x: 1, y: 1 }, 0.1, map);
    expect(p.x).toBeCloseTo(stuckX); // x는 막혀 있고
    expect(p.y).toBeGreaterThan(before); // y는 움직인다
  });

  it('대각선 이동이 직선 이동보다 빠르지 않다', () => {
    const start = createPlayer(map);
    const straight = movePlayer(start, { x: 1, y: 0 }, 0.5, map);
    const diagInput = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
    const diagonal = movePlayer(start, diagInput, 0.5, map);
    const dStraight = Math.hypot(straight.x - start.x, straight.y - start.y);
    const dDiagonal = Math.hypot(diagonal.x - start.x, diagonal.y - start.y);
    expect(dDiagonal).toBeCloseTo(dStraight, 5);
  });

  it('맵 밖으로 나가지 않는다', () => {
    let p = createPlayer(map);
    for (let i = 0; i < 200; i++) p = movePlayer(p, { x: -1, y: -1 }, 0.05, map);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });

  it('solid 가 아닌 오브젝트도 상호작용 대상이 된다', () => {
    const p = { x: 112, y: 312, facing: 'down' as const };
    expect(findNearest(p, map)?.object.id).toBe('coffee');
  });

  it('큰 오브젝트는 경계 기준으로 판정한다 (중심이 멀어도 붙어 있으면 조사 가능)', () => {
    // 책상 rect: x 400~496, y 400~464 → 중심 (448, 432)
    const infront = { x: 448, y: 388, facing: 'down' as const }; // 경계에서 12px, 중심에서 44px
    expect(findNearest(infront, map)?.object.id).toBe('desk');

    const corner = { x: 380, y: 380, facing: 'down' as const }; // 경계에서 28px, 중심에서 85px
    expect(findNearest(corner, map)?.object.id).toBe('desk');

    const far = { x: 448, y: 330, facing: 'down' as const }; // 경계에서 70px
    expect(findNearest(far, map)).toBeNull();
  });

  it('멀어지면 상호작용 대상이 없다', () => {
    const p = { x: 900, y: 700, facing: 'down' as const };
    expect(findNearest(p, map)).toBeNull();
  });
});

describe('카메라', () => {
  it('맵 경계 밖 여백을 비추지 않는다', () => {
    const topLeft = computeCamera({ x: 0, y: 0 }, map, 960, 640);
    expect(topLeft).toEqual({ x: 0, y: 0 });
    const bottomRight = computeCamera({ x: 1000, y: 800 }, map, 960, 640);
    expect(bottomRight).toEqual({ x: 1000 - 960, y: 800 - 640 });
  });

  it('맵 중앙에서는 플레이어를 화면 중앙에 둔다', () => {
    expect(computeCamera({ x: 500, y: 400 }, map, 960, 640)).toEqual({ x: 20, y: 80 });
  });
});
