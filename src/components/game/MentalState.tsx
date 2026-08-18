'use client';

/** gamd.md 8장 — 정신력 구간 */
export function mentalLabel(mental: number): string {
  if (mental >= 80) return '안정';
  if (mental >= 60) return '불안';
  if (mental >= 40) return '집중 저하';
  if (mental >= 20) return '손 떨림';
  return '판단 어려움';
}

export default function MentalState({ mental, max = 100 }: { mental: number; max?: number }) {
  return (
    <div className="ui-mental">
      정신력 {mental}/{max} — {mentalLabel(mental)}
    </div>
  );
}
