import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_MAX_MENTAL as MAX_MENTAL, useGameStore } from './gameStore';

const store = () => useGameStore.getState();

beforeEach(() => store().resetGame());

describe('GameState', () => {
  it('정신력은 0~100 으로 클램프된다', () => {
    store().changeMental(50);
    expect(store().mental).toBe(MAX_MENTAL);
    store().changeMental(-500);
    expect(store().mental).toBe(0);
    store().changeMental(30);
    expect(store().mental).toBe(30);
  });

  it('같은 아이템을 두 번 획득하지 않는다', () => {
    store().addItem('item_strange_coffee');
    store().addItem('item_strange_coffee');
    expect(store().inventory).toEqual(['item_strange_coffee']);
  });

  it('같은 증거를 두 번 담지 않고 카테고리를 유지한다', () => {
    store().addEvidence('ev_0748_coffee', 'MEMORY');
    store().addEvidence('ev_0748_coffee', 'MEMORY');
    expect(store().evidence).toEqual([{ id: 'ev_0748_coffee', category: 'MEMORY' }]);
  });

  it('노트와 플래그, 인물 단서를 기록한다', () => {
    store().addNote('note_coffee_order');
    store().addNote('note_coffee_order');
    store().setFlag('kept_coffee', true);
    store().addCharacterClue('guard', '야간 출입 기록을 안다');
    store().addCharacterClue('guard', '야간 출입 기록을 안다');
    expect(store().notes).toEqual(['note_coffee_order']);
    expect(store().flags.kept_coffee).toBe(true);
    expect(store().characterClues.guard).toHaveLength(1);
  });

  it('문자 수신은 중복되지 않고 미읽음 수를 올린다', () => {
    store().receiveMessage('msg_2228');
    store().receiveMessage('msg_2228');
    store().receiveMessage('msg_2230');
    expect(store().messages).toEqual(['msg_2228', 'msg_2230']);
    expect(store().unreadMessages).toBe(2);
    store().markMessagesRead();
    expect(store().unreadMessages).toBe(0);
  });

  it('resetGame 이 초기 상태로 되돌린다', () => {
    store().changeMental(-40);
    store().addItem('x');
    store().completeInteraction('obj_coffee');
    store().resetGame();
    expect(store().mental).toBe(MAX_MENTAL);
    expect(store().inventory).toEqual([]);
    expect(store().completedInteractions).toEqual([]);
    expect(store().currentLocation).toBe('home');
    expect(store().pendingSpawn).toBeNull();
  });

  it('장소와 도착 스폰을 함께 바꾼다', () => {
    store().travelTo('home', 'from_street');
    expect(store().currentLocation).toBe('home');
    expect(store().pendingSpawn).toBe('from_street');
  });
});
