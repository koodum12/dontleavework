import { describe, expect, it } from 'vitest';
import type { EventFile, GameEvent } from './Event';
import type { Condition } from './Condition';

/** day1 리스크 대응: gamd.md 예시 JSON을 타입에 실제로 대입해 검증한다 */
describe('이벤트 타입 스키마', () => {
  it('gamd.md 6장의 chapter1_coffee 예시가 GameEvent 에 대입된다', () => {
    const coffee: GameEvent = {
      id: 'chapter1_coffee',
      type: 'dialogue',
      speaker: '사랑',
      text: '누가 주문했다고…?',
      choices: [
        { text: '커피를 마신다', next: 'coffee_drink', effects: [{ type: 'mentalChange', amount: 10 }] },
        { text: '커피를 보관한다', next: 'coffee_save', effects: [{ type: 'itemGet', id: 'item_strange_coffee' }] },
        { text: '커피를 버린다', next: 'coffee_throw' },
      ],
    };
    expect(coffee.choices).toHaveLength(3);
  });

  it('gamd.md 11장의 엔딩 조건 예시가 Condition[] 에 대입된다', () => {
    const conditions: Condition[] = [
      { type: 'evidence_count', category: 'MEMORY', min: 2 },
      { type: 'character_clue_count', min: 2 },
      { type: 'flag', key: 'intrusion_evidence', value: true },
    ];
    expect(conditions).toHaveLength(3);
  });

  it('빈 이벤트 파일이 EventFile 형태와 맞는다', () => {
    const file: EventFile = { events: [] };
    expect(file.events).toEqual([]);
  });
});
