import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectionStats, endingChecklists, endingLockReason, resolveEnding } from './EndingManager';
import type { EndingFile } from '@/data/types';
import type { GameStateData } from '@/game/state/gameStore';

const file = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/endings.json'), 'utf8'),
) as EndingFile;

const base: GameStateData = {
  mental: 100, inventory: [], evidence: [], characterClues: {}, flags: {}, notes: [],
  messages: [], photos: [], unreadMessages: 0, completedInteractions: [],
  currentChapter: null, currentEvent: null, ending: null,
};
const state = (over: Partial<GameStateData>): GameStateData => ({ ...base, ...over });

const twoMemory = [
  { id: 'ev_0748_coffee', category: 'MEMORY' as const },
  { id: 'ev_memory_01', category: 'MEMORY' as const },
];
const twoCharacters = { guard: ['a'], team_leader: ['b'] };

const trueFlags = { intrusion_evidence: true };
const hiddenFlags = {
  ...trueFlags,
  checked_cctv: true, checked_memory_01: true, found_0213: true, checked_network_log: true,
  recovered_deleted_note: true, recovered_voice_memo: true, compared_clues: true,
  recovered_prememory: true,
};

describe('EndingManager — 4개 엔딩 픽스처', () => {
  it('BAD — 혼자 추궁했다', () => {
    const s = state({ flags: { accused_alone: true } });
    expect(resolveEnding(file, s)?.id).toBe('bad');
  });

  it('NORMAL — MEMORY 를 지우고 떠났다', () => {
    const s = state({ flags: { memory_deleted: true } });
    expect(resolveEnding(file, s)?.id).toBe('normal');
  });

  it('TRUE — MEMORY 2 + 인물 2 + 침입 기록', () => {
    const s = state({ evidence: twoMemory, characterClues: twoCharacters, flags: trueFlags });
    expect(resolveEnding(file, s)?.id).toBe('true');
  });

  it('HIDDEN — TRUE 조건 + 전체 조사 루트', () => {
    const s = state({ evidence: twoMemory, characterClues: twoCharacters, flags: hiddenFlags });
    expect(resolveEnding(file, s)?.id).toBe('hidden');
  });
});

describe('EndingManager — 경계', () => {
  it('MEMORY 증거가 1개면 TRUE 가 아니다', () => {
    const s = state({
      evidence: [twoMemory[0], { id: 'ev_cctv', category: 'case' }],
      characterClues: twoCharacters,
      flags: trueFlags,
    });
    expect(resolveEnding(file, s)?.id).not.toBe('true');
  });

  it('혼자 추궁하면 HIDDEN/TRUE 조건을 갖춰도 BAD 로 떨어진다', () => {
    const s = state({
      evidence: twoMemory, characterClues: twoCharacters,
      flags: { ...hiddenFlags, accused_alone: true },
    });
    expect(resolveEnding(file, s)?.id).toBe('bad');
  });

  it('HIDDEN 조건 하나(음성 메모 복구)가 빠지면 TRUE 로 내려간다', () => {
    const s = state({
      evidence: twoMemory, characterClues: twoCharacters,
      flags: { ...hiddenFlags, recovered_voice_memo: false },
    });
    expect(resolveEnding(file, s)?.id).toBe('true');
  });

  it('아무 조건도 못 채우면 엔딩 없음', () => {
    expect(resolveEnding(file, base)).toBeNull();
  });

  it('평가 순서는 HIDDEN → TRUE → NORMAL → BAD', () => {
    expect(file.endings.map((e) => e.id)).toEqual(['hidden', 'true', 'normal', 'bad']);
  });

  it('잠금 사유를 알려 준다', () => {
    const hidden = file.endings[0];
    expect(endingLockReason(hidden, base)).toBeTruthy();
  });

  it('수집률을 센다', () => {
    const s = state({ evidence: twoMemory, characterClues: twoCharacters });
    expect(collectionStats(s, 23)).toEqual({
      evidenceCollected: 2, evidenceTotal: 23, memoryCollected: 2,
      characterCluesCollected: 2, characterTotal: 5,
    });
  });
});

describe('엔딩 체크리스트', () => {
  it('도달한 엔딩을 표시하고 조건별 충족 여부를 돌려준다', () => {
    const s = state({ evidence: twoMemory, characterClues: twoCharacters, flags: trueFlags });
    const lists = endingChecklists(file, s, 'true');

    const trueList = lists.find((l) => l.id === 'true')!;
    expect(trueList.reached).toBe(true);
    expect(trueList.rows.every((r) => r.met)).toBe(true);

    const hiddenList = lists.find((l) => l.id === 'hidden')!;
    expect(hiddenList.reached).toBe(false);
    expect(hiddenList.rows.some((r) => !r.met)).toBe(true);
    // 조건이 사람이 읽는 말로 나온다
    expect(hiddenList.rows.map((r) => r.label)).toContain('CCTV 확인');
    expect(hiddenList.rows.map((r) => r.label)).toContain('MEMORY 증거 2개 이상');
  });

  it('4개 엔딩 전부의 체크리스트를 만든다', () => {
    expect(endingChecklists(file, base, null).map((l) => l.id)).toEqual(['hidden', 'true', 'normal', 'bad']);
  });
});
