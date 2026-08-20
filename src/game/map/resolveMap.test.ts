import { describe, expect, it } from 'vitest';
import type { GameMap, NpcFile, PaletteFile } from '@/data/types';
import type { GameStateData } from '@/game/state/gameStore';
import { resolveMap } from './resolveMap';

const map: GameMap = {
  id: 'office',
  name: '사무실',
  palette: 'day',
  variants: [{
    id: 'night',
    palette: 'night',
    nameSuffix: ' (야간)',
    conditions: [{ type: 'flag', key: 'night', value: true }],
  }],
  width: 960,
  height: 640,
  spawn: { x: 100, y: 100 },
  walls: [],
  objects: [
    { id: 'always', label: '항상', x: 0, y: 0, w: 10, h: 10, solid: false },
    {
      id: 'night-only', label: '야간', x: 20, y: 0, w: 10, h: 10, solid: false,
      conditions: [{ type: 'flag', key: 'night', value: true }],
    },
  ],
};

const npcs: NpcFile = {
  day: {
    id: 'day', characterId: 'daeri', location: 'office', label: '대리',
    x: 100, y: 100, w: 24, h: 32, facing: 'down', solid: true,
    conditions: [{ type: 'flag', key: 'night', value: false }],
  },
  nightFirst: {
    id: 'night-first', characterId: 'daeri', location: 'office', label: '대리',
    x: 200, y: 100, w: 24, h: 32, facing: 'left', solid: true,
    conditions: [{ type: 'flag', key: 'night', value: true }],
  },
  nightDuplicate: {
    id: 'night-second', characterId: 'daeri', location: 'office', label: '대리 복제',
    x: 300, y: 100, w: 24, h: 32, facing: 'right', solid: true,
    conditions: [{ type: 'flag', key: 'night', value: true }],
  },
};

const palettes: PaletteFile = {
  day: { floor: '#111', grid: '#222', wall: '#333', object: '#444' },
  night: { floor: '#000', grid: '#111', wall: '#222', object: '#333' },
};

const state = (flags: Record<string, boolean>): GameStateData => ({
  mental: 100,
  inventory: [],
  evidence: [],
  characterClues: {},
  flags,
  notes: [],
  messages: [],
  photos: [],
  unreadMessages: 0,
  completedInteractions: [],
  currentChapter: null,
  currentEvent: null,
  currentLocation: 'office',
  pendingSpawn: null,
  ending: null,
});

describe('resolveMap', () => {
  it('조건에 따라 오브젝트와 팔레트, 장소 이름을 바꾼다', () => {
    const day = resolveMap(map, npcs, palettes, state({}));
    expect(day.objects.map((object) => object.id)).toEqual(['always']);
    expect(day.resolvedName).toBe('사무실');
    expect(day.resolvedPaletteId).toBe('day');

    const night = resolveMap(map, npcs, palettes, state({ night: true }));
    expect(night.objects.map((object) => object.id)).toEqual(['always', 'night-only']);
    expect(night.resolvedName).toBe('사무실 (야간)');
    expect(night.resolvedPaletteId).toBe('night');
  });

  it('같은 인물 후보가 겹치면 파일에서 먼저 선언된 한 명만 둔다', () => {
    const night = resolveMap(map, npcs, palettes, state({ night: true }));
    expect(night.npcs).toHaveLength(1);
    expect(night.npcs[0].id).toBe('night-first');
  });
});
