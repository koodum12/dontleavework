'use client';

import { useGameStore } from './gameStore';
import { mentalBand } from './mental';

/**
 * 정신력 구간에 따라 텍스트를 흔드는 연출 훅 (연출 자체는 Day 4).
 *
 * 핵심 원칙: **기록 노트의 증거 원문은 절대 왜곡하지 않는다.**
 * immune: true 로 호출한 텍스트는 어떤 구간에서도 원문 그대로 반환한다.
 */
export function useMentalFilter(text: string, options: { immune?: boolean } = {}): string {
  const mental = useGameStore((s) => s.mental);
  const bands = useGameStore((s) => s.mentalConfig?.bands ?? []);
  if (options.immune) return text;

  const band = mentalBand(mental, bands);
  // Day 3 에서는 자리만 잡아 둔다. Day 4 에서 구간별 왜곡 연출을 붙인다.
  void band;
  return text;
}

/** 현재 구간 id (연출/스타일 분기용) */
export function useMentalBandId(): string | null {
  const mental = useGameStore((s) => s.mental);
  const bands = useGameStore((s) => s.mentalConfig?.bands ?? []);
  return mentalBand(mental, bands)?.id ?? null;
}
