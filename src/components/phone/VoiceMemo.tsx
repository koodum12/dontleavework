'use client';

export interface Memo {
  id: string;
  title: string;
  length: string;
}

export default function VoiceMemo({ memos }: { memos: Memo[] }) {
  if (memos.length === 0) return <p>음성 메모가 없습니다.</p>;
  return (
    <ul className="ui-list">
      {memos.map((m) => (
        <li key={m.id}>
          {m.title} ({m.length})
        </li>
      ))}
    </ul>
  );
}
