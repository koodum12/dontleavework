'use client';

import Button from '../common/Button';
import type { EndingMeta } from '@/data/types';
import type { CollectionStats, EndingChecklist } from '@/game/ending/EndingManager';

interface Props {
  ending: EndingMeta | null;
  text: string;
  stats: CollectionStats;
  checklists: EndingChecklist[];
  unlocked: string[];
  onRestart: () => void;
}

export default function EndingScreen({ ending, text, stats, checklists, unlocked, onRestart }: Props) {
  if (!ending) return null;
  const total = checklists.length;

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

        {/* 조건은 끝난 뒤에 공개한다 — 다음 회차를 위한 정보 */}
        <section className="ending-checklists" data-testid="ending-checklist">
          <h3>이번 회차에 갖춘 조건</h3>
          {checklists.map((c) => (
            <article key={c.id} className={c.reached ? 'is-reached' : ''}>
              <h4>{c.name}{c.reached ? ' — 도달' : ''}</h4>
              <ul>
                {c.rows.map((r) => (
                  <li key={r.label} className={r.met ? 'met' : 'unmet'}>
                    {r.met ? '✓' : '✗'} {r.label}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <p className="ending-archive" data-testid="ending-archive">
          기록 보관함 {unlocked.length} / {total}
        </p>
        <Button onClick={onRestart}>처음부터 다시</Button>
      </div>
    </div>
  );
}
