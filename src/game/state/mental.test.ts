import { describe, expect, it } from 'vitest';
import { mentalBand, mentalLabel, resolveDelta } from './mental';
import type { MentalBand, MentalConfig } from '@/data/types';

const bands: MentalBand[] = [
  { id: 'stable', min: 80, max: 100, label: '안정' },
  { id: 'uneasy', min: 60, max: 79, label: '불안' },
  { id: 'unfocused', min: 40, max: 59, label: '집중 저하' },
  { id: 'trembling', min: 20, max: 39, label: '손 떨림' },
  { id: 'breaking', min: 0, max: 19, label: '판단 어려움' },
];

describe('정신력 구간', () => {
  const cases: [number, string][] = [
    [100, '안정'], [80, '안정'], [79, '불안'], [60, '불안'],
    [59, '집중 저하'], [40, '집중 저하'], [39, '손 떨림'], [20, '손 떨림'],
    [19, '판단 어려움'], [0, '판단 어려움'],
  ];
  for (const [value, label] of cases) {
    it(`${value} → ${label}`, () => expect(mentalLabel(value, bands)).toBe(label));
  }

  it('구간을 벗어나면 null', () => {
    expect(mentalBand(101, bands)).toBeNull();
  });
});

describe('정신력 변화량 참조', () => {
  const config: MentalConfig = { max: 100, start: 100, bands, deltas: { check_cctv: -10 } };

  it('이름으로 데이터의 수치를 찾는다', () => {
    expect(resolveDelta('check_cctv', config)).toBe(-10);
  });

  it('정의되지 않은 이름은 0 (게임은 죽지 않는다)', () => {
    expect(resolveDelta('없는것', config)).toBe(0);
    expect(resolveDelta('check_cctv', null)).toBe(0);
  });
});
