import type { MentalBand, MentalConfig } from '@/data/types';

/** 구간 판정 — 순수 함수. 구간 정의는 public/data/mental.json 에서 온다 */
export function mentalBand(value: number, bands: MentalBand[]): MentalBand | null {
  return bands.find((b) => value >= b.min && value <= b.max) ?? null;
}

export function mentalLabel(value: number, bands: MentalBand[]): string {
  return mentalBand(value, bands)?.label ?? '-';
}

/** 이름으로 정의된 정신력 변화량을 찾는다 (없으면 0 + 경고) */
export function resolveDelta(name: string, config: MentalConfig | null): number {
  const delta = config?.deltas[name];
  if (delta === undefined) {
    console.warn(`[mental] 정의되지 않은 정신력 변화: "${name}"`);
    return 0;
  }
  return delta;
}
