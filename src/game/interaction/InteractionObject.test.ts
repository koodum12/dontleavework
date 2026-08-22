import { beforeEach, describe, expect, it } from 'vitest';
import type { MapObject, TravelTarget } from '@/data/types';
import { useGameStore } from '@/game/state/gameStore';
import { toInteractable, type NearestResult } from './InteractionManager';
import { triggerInteraction } from './InteractionObject';

const target = (travel: TravelTarget): NearestResult => {
  const object: MapObject = {
    id: 'test_door',
    label: '밖으로 나가기',
    x: 0,
    y: 0,
    w: 32,
    h: 32,
    solid: false,
    travel,
  };
  return { object, interactable: toInteractable(object), distance: 0 };
};

describe('이동 진행 잠금', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useGameStore.getState().travelTo('office');
  });

  it('현재 장의 미완료 블록이 있으면 이동하지 않고 안내 문구를 돌려준다', () => {
    useGameStore.getState().setChapter('chapter03');
    const result = triggerInteraction(target({
      to: 'street',
      blocks: [{
        conditions: [
          { type: 'current_chapter', value: 'chapter03' },
          { type: 'flag', key: 'asked_daeri', value: false },
        ],
        lockedText: '대리에게 먼저 확인할 것이 있다.',
      }],
    }));

    expect(result).toEqual({ reason: 'locked', message: '대리에게 먼저 확인할 것이 있다.' });
    expect(useGameStore.getState().currentLocation).toBe('office');
  });

  it('블록 조건을 끝내면 같은 문으로 이동할 수 있다', () => {
    const store = useGameStore.getState();
    store.setChapter('chapter03');
    store.setFlag('asked_daeri', true);

    const result = triggerInteraction(target({
      to: 'street',
      spawn: 'from_lobby',
      blocks: [{
        conditions: [
          { type: 'current_chapter', value: 'chapter03' },
          { type: 'flag', key: 'asked_daeri', value: false },
        ],
        lockedText: '대리에게 먼저 확인할 것이 있다.',
      }],
    }));

    expect(result.reason).toBe('traveled');
    expect(useGameStore.getState().currentLocation).toBe('street');
    expect(useGameStore.getState().pendingSpawn).toBe('from_lobby');
  });
});
