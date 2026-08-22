'use client';

import Button from '../common/Button';
import type { EndingMeta } from '@/data/types';
import type { CollectionStats } from '@/game/ending/EndingManager';

interface Props {
  ending: EndingMeta | null;
  text: string;
  stats: CollectionStats;
  unlocked: string[];
  onRestart: () => void;
}

export default function EndingScreen({ ending, text, stats, unlocked, onRestart }: Props) {
  if (!ending) return null;

  return (
    <div className="ending-screen" data-testid="ending-screen">
      <div className="ending-inner">
        <h2 data-testid="ending-name">{ending.name}</h2>
        <p className="ending-summary">{ending.summary}</p>
        <p className="ending-text">{text}</p>

        <dl className="ui-debug ending-stats">
          <dt>증거</dt>
          <dd data-testid="ending-evidence">{stats.evidenceCollected} / {stats.evidenceTotal}</dd>
          <dt>MEMORY 증거</dt>
          <dd>{stats.memoryCollected}</dd>
          <dt>인물 단서</dt>
          <dd>{stats.characterCluesCollected} / {stats.characterTotal}</dd>
        </dl>

        <p className="ending-archive" data-testid="ending-archive">
          발견한 엔딩 {unlocked.length} / 4
        </p>
        <Button onClick={onRestart}>처음부터 다시</Button>
      </div>
    </div>
  );
}
