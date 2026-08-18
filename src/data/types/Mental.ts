export interface MentalBand {
  id: string;
  min: number;
  max: number;
  label: string;
}

export interface MentalConfig {
  max: number;
  start: number;
  bands: MentalBand[];
  /** 사건별 정신력 변화량 — 수치는 코드가 아니라 데이터에 둔다 (day3 §1) */
  deltas: Record<string, number>;
}
