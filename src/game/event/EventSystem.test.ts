import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseEventFile, validateReferences } from './EventParser';
import { applyEffects, executeChoice, executeEvent } from './EventExecutor';
import { useEventStore } from './EventManager';
import { useGameStore } from '@/game/state/gameStore';
import type { GameEvent } from '@/data/types';

const chapter01 = {
  events: [
    { id: 'a', type: 'dialogue', speaker: '사랑', speakerId: 'sarang', text: '1', next: 'b' },
    { id: 'b', type: 'choice', text: '고른다', choices: [
      { text: '보관', next: 'save' },
      { text: '버린다', next: 'throw' },
    ] },
    { id: 'save', type: 'dialogue', text: '보관했다', effects: [
      { type: 'itemGet', id: 'item_strange_coffee' },
      { type: 'evidenceGet', id: 'ev_0748_coffee', category: 'MEMORY' },
      { type: 'noteAdd', id: 'note_coffee_order' },
      { type: 'flagSet', key: 'kept_coffee', value: true },
      { type: 'mentalChange', amount: -5 },
      { type: 'travel', to: 'home', spawn: 'from_street' },
    ] },
    { id: 'throw', type: 'dialogue', text: '버렸다', next: 'nowhere' },
  ],
};

beforeEach(() => {
  useGameStore.getState().resetGame();
  useEventStore.getState().stop();
  useEventStore.getState().loadFromRaw([{ source: 'test', raw: chapter01 }]);
});

describe('EventParser', () => {
  it('이벤트를 id 로 평탄화한다', () => {
    const { events } = parseEventFile(chapter01, 'test');
    expect([...events.keys()]).toEqual(['a', 'b', 'save', 'throw']);
  });

  it('잘못된 이벤트는 버리고 경고만 남긴다', () => {
    const { events, warnings } = parseEventFile(
      { events: [{ id: 'ok', type: 'dialogue' }, { type: 'dialogue' }, { id: 'x', type: '이상함' }, { id: 'c', type: 'choice' }] },
      'bad',
    );
    expect([...events.keys()]).toEqual(['ok']);
    expect(warnings).toHaveLength(3);
  });

  it('events 배열이 없어도 죽지 않는다', () => {
    expect(parseEventFile({ nope: true }, 'bad').events.size).toBe(0);
  });

  it('존재하지 않는 next 참조를 찾아낸다', () => {
    const { events } = parseEventFile(chapter01, 'test');
    expect(validateReferences(events)).toEqual(['throw → 존재하지 않는 이벤트 "nowhere"']);
  });
});

describe('EventExecutor', () => {
  it('effects 를 GameState 에 적용하고 next 를 돌려준다', () => {
    const event = chapter01.events[2] as GameEvent;
    const next = executeEvent(event, useGameStore.getState());
    const s = useGameStore.getState();
    expect(next).toBeNull();
    expect(s.inventory).toEqual(['item_strange_coffee']);
    expect(s.evidence).toEqual([{ id: 'ev_0748_coffee', category: 'MEMORY' }]);
    expect(s.notes).toEqual(['note_coffee_order']);
    expect(s.flags.kept_coffee).toBe(true);
    expect(s.mental).toBe(95);
    expect(s.currentLocation).toBe('home');
    expect(s.pendingSpawn).toBe('from_street');
  });

  it('없는 선택지를 고르면 경고 후 null 을 돌려준다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(executeChoice(chapter01.events[1] as GameEvent, 9, useGameStore.getState())).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('알 수 없는 effect 를 만나도 죽지 않는다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    applyEffects([{ type: '이상함' } as never], useGameStore.getState());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('EventManager', () => {
  it('start → advance → choose 체인이 돈다', () => {
    const m = useEventStore.getState();
    expect(m.start('a')).toBe(true);
    expect(useEventStore.getState().current?.id).toBe('a');
    expect(useGameStore.getState().currentEvent).toBe('a');

    useEventStore.getState().advance('a');
    expect(useEventStore.getState().current?.id).toBe('b');

    useEventStore.getState().choose('b', 0);
    expect(useEventStore.getState().current?.id).toBe('save');
    expect(useGameStore.getState().inventory).toEqual(['item_strange_coffee']);

    useEventStore.getState().advance('save'); // next 없음 → 체인 종료
    expect(useEventStore.getState().current).toBeNull();
    expect(useGameStore.getState().currentEvent).toBeNull();
  });

  it('같은 선택을 두 번 눌러도 한 번만 진행한다', () => {
    useEventStore.getState().start('a');
    useEventStore.getState().advance('a');
    useEventStore.getState().choose('b', 0);
    useEventStore.getState().choose('b', 1); // 이미 지나간 이벤트에서 온 입력 → 무시
    expect(useEventStore.getState().current?.id).toBe('save');
    expect(useGameStore.getState().flags.kept_coffee).toBe(true);
  });

  it('선택지 이벤트는 advance 로 넘어가지 않는다', () => {
    useEventStore.getState().start('a');
    useEventStore.getState().advance('a');
    useEventStore.getState().advance('b');
    expect(useEventStore.getState().current?.id).toBe('b');
  });

  it('이벤트 진행 중에는 새 이벤트가 시작되지 않는다', () => {
    useEventStore.getState().start('a');
    expect(useEventStore.getState().start('save')).toBe(false);
    expect(useEventStore.getState().current?.id).toBe('a');
  });

  it('존재하지 않는 next 를 만나면 경고 후 체인이 끝난다 (앱은 죽지 않는다)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useEventStore.getState().start('throw');
    useEventStore.getState().advance('throw');
    expect(useEventStore.getState().current).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('존재하지 않는 id 로 start 해도 죽지 않는다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(useEventStore.getState().start('없는이벤트')).toBe(false);
    expect(useEventStore.getState().current).toBeNull();
    warn.mockRestore();
  });
});
