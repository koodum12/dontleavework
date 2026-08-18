'use client';

import type { GameStateData } from '@/game/state/gameStore';

/**
 * 선택 시점에 보여 주는 **확보 상태**.
 * 어떤 엔딩으로 가는지는 말하지 않는다. 엔딩 조건이 되는 수치만 사실대로 보여 준다.
 */
export default function CollectionStrip({ state }: { state: GameStateData }) {
  const memory = state.evidence.filter((e) => e.category === 'MEMORY').length;
  const characters = Object.values(state.characterClues).filter((c) => c.length > 0).length;
  const intrusion = state.flags.intrusion_evidence === true;

  return (
    <div className="collection-strip" data-testid="collection-strip">
      <span className="collection-label">확보</span>
      <span data-testid="strip-memory">MEMORY {memory}</span>
      <span data-testid="strip-clues">인물 단서 {characters}</span>
      <span data-testid="strip-intrusion" className={intrusion ? '' : 'is-missing'}>
        침입 기록 {intrusion ? '있음' : '없음'}
      </span>
    </div>
  );
}
