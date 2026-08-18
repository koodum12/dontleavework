import { describe, expect, it } from 'vitest';
import { evaluate, evaluateOne, firstUnmet } from './ConditionManager';
import type { Condition } from '@/data/types';
import type { GameStateData } from '@/game/state/gameStore';

const base: GameStateData = {
  mental: 100,
  inventory: [],
  evidence: [],
  characterClues: {},
  flags: {},
  notes: [],
  messages: [],
  photos: [],
  unreadMessages: 0,
  completedInteractions: [],
  currentChapter: null,
  currentEvent: null,
  ending: null,
};

const state = (over: Partial<GameStateData>): GameStateData => ({ ...base, ...over });

/** gamd.md 15장 TRUE ENDING 조건 */
const TRUE_ENDING: Condition[] = [
  { type: 'evidence_count', category: 'MEMORY', min: 2 },
  { type: 'character_clue_count', min: 2 },
  { type: 'flag', key: 'intrusion_evidence', value: true },
  { type: 'flag', key: 'accused_alone', value: false },
];

describe('ConditionManager — 개별 조건', () => {
  it('flag', () => {
    expect(evaluateOne({ type: 'flag', key: 'checked_cctv', value: true }, state({ flags: { checked_cctv: true } }))).toBe(true);
    expect(evaluateOne({ type: 'flag', key: 'checked_cctv', value: true }, base)).toBe(false);
    // 설정된 적 없는 플래그는 false 로 본다
    expect(evaluateOne({ type: 'flag', key: 'never_set', value: false }, base)).toBe(true);
  });

  it('evidence_count — 카테고리별/전체', () => {
    const s = state({
      evidence: [
        { id: 'a', category: 'MEMORY' },
        { id: 'b', category: 'MEMORY' },
        { id: 'c', category: 'case' },
      ],
    });
    expect(evaluateOne({ type: 'evidence_count', category: 'MEMORY', min: 2 }, s)).toBe(true);
    expect(evaluateOne({ type: 'evidence_count', category: 'MEMORY', min: 3 }, s)).toBe(false);
    expect(evaluateOne({ type: 'evidence_count', min: 3 }, s)).toBe(true);
  });

  it('character_clue_count — 단서 총합이 아니라 인물 수로 센다', () => {
    const oneCharacterManyClues = state({ characterClues: { guard: ['a', 'b', 'c'] } });
    expect(evaluateOne({ type: 'character_clue_count', min: 2 }, oneCharacterManyClues)).toBe(false);

    const twoCharacters = state({ characterClues: { guard: ['a'], team_leader: ['b'] } });
    expect(evaluateOne({ type: 'character_clue_count', min: 2 }, twoCharacters)).toBe(true);

    // 빈 배열만 있는 인물은 세지 않는다
    expect(evaluateOne({ type: 'character_clue_count', min: 2 }, state({ characterClues: { guard: ['a'], peer: [] } }))).toBe(false);
  });

  it('has_item / has_evidence', () => {
    expect(evaluateOne({ type: 'has_item', itemId: 'x' }, state({ inventory: ['x'] }))).toBe(true);
    expect(evaluateOne({ type: 'has_evidence', evidenceId: 'e' }, state({ evidence: [{ id: 'e', category: 'case' }] }))).toBe(true);
    expect(evaluateOne({ type: 'has_item', itemId: 'x' }, base)).toBe(false);
  });

  it('mental_below / mental_above 는 경계값을 포함하지 않는다', () => {
    expect(evaluateOne({ type: 'mental_below', value: 40 }, state({ mental: 39 }))).toBe(true);
    expect(evaluateOne({ type: 'mental_below', value: 40 }, state({ mental: 40 }))).toBe(false);
    expect(evaluateOne({ type: 'mental_above', value: 80 }, state({ mental: 81 }))).toBe(true);
    expect(evaluateOne({ type: 'mental_above', value: 80 }, state({ mental: 80 }))).toBe(false);
  });
});

describe('ConditionManager — 조합', () => {
  it('조건이 없으면 통과한다', () => {
    expect(evaluate(undefined, base)).toBe(true);
    expect(evaluate([], base)).toBe(true);
  });

  it('AND 로 판정한다', () => {
    const s = state({ flags: { a: true }, inventory: ['x'] });
    expect(evaluate([{ type: 'flag', key: 'a', value: true }, { type: 'has_item', itemId: 'x' }], s)).toBe(true);
    expect(evaluate([{ type: 'flag', key: 'a', value: true }, { type: 'has_item', itemId: 'y' }], s)).toBe(false);
  });

  it('만족하지 못한 첫 조건을 돌려준다', () => {
    const unmet = firstUnmet([{ type: 'flag', key: 'a', value: true }, { type: 'has_item', itemId: 'y' }], base);
    expect(unmet).toEqual({ type: 'flag', key: 'a', value: true });
  });
});

describe('진 엔딩 조건 테이블', () => {
  const cases: { name: string; state: GameStateData; expected: boolean }[] = [
    {
      name: '전부 충족',
      state: state({
        evidence: [{ id: 'm1', category: 'MEMORY' }, { id: 'm2', category: 'MEMORY' }],
        characterClues: { guard: ['야간 출입'], team_leader: ['출력 기록'] },
        flags: { intrusion_evidence: true },
      }),
      expected: true,
    },
    {
      name: 'MEMORY 증거 1개뿐',
      state: state({
        evidence: [{ id: 'm1', category: 'MEMORY' }, { id: 'c1', category: 'case' }],
        characterClues: { guard: ['a'], team_leader: ['b'] },
        flags: { intrusion_evidence: true },
      }),
      expected: false,
    },
    {
      name: '인물 단서가 한 명에게만 몰림',
      state: state({
        evidence: [{ id: 'm1', category: 'MEMORY' }, { id: 'm2', category: 'MEMORY' }],
        characterClues: { guard: ['a', 'b', 'c'] },
        flags: { intrusion_evidence: true },
      }),
      expected: false,
    },
    {
      name: '침입 기록 없음',
      state: state({
        evidence: [{ id: 'm1', category: 'MEMORY' }, { id: 'm2', category: 'MEMORY' }],
        characterClues: { guard: ['a'], peer: ['b'] },
        flags: {},
      }),
      expected: false,
    },
    {
      name: '특정 인물을 단둘이 추궁함',
      state: state({
        evidence: [{ id: 'm1', category: 'MEMORY' }, { id: 'm2', category: 'MEMORY' }],
        characterClues: { guard: ['a'], peer: ['b'] },
        flags: { intrusion_evidence: true, accused_alone: true },
      }),
      expected: false,
    },
  ];

  for (const c of cases) {
    it(c.name, () => expect(evaluate(TRUE_ENDING, c.state)).toBe(c.expected));
  }
});
