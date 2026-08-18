'use client';

import type { Note } from '@/data/types';

export default function RecordNote({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return <p>기록된 내용이 없습니다.</p>;
  return (
    <ul className="ui-list">
      {notes.map((n) => (
        <li key={n.id}>
          <div>사실: {n.fact}</div>
          {n.assumption && <div>추측: {n.assumption}</div>}
          {n.nextCheck && <div>다음 확인: {n.nextCheck}</div>}
        </li>
      ))}
    </ul>
  );
}
