'use client';

import type { VoiceMemoData } from '@/data/types';

export default function VoiceMemo({ memos }: { memos: VoiceMemoData[] }) {
  if (memos.length === 0) return <p>음성 메모가 없습니다.</p>;
  return (
    <ul className="ui-list" data-testid="voice-memo">
      {memos.map((m) => (
        <li key={m.id}>
          <div>{m.title} ({m.length})</div>
          {m.transcript && <small>{m.transcript}</small>}
        </li>
      ))}
    </ul>
  );
}
