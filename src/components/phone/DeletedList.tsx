'use client';

import type { PhoneMessage, VoiceMemoData } from '@/data/types';

interface Props {
  messages: PhoneMessage[];
  memos: VoiceMemoData[];
  flags: Record<string, boolean>;
}

/** 삭제된 항목 — 복구 플래그가 켜져야 내용이 보인다 */
export default function DeletedList({ messages, memos, flags }: Props) {
  const entries = [
    ...messages.map((m) => ({ id: m.id, title: `문자 · ${m.from}`, body: m.text, key: m.recoveredBy })),
    ...memos.map((m) => ({ id: m.id, title: `음성 메모 · ${m.title}`, body: m.transcript ?? '', key: m.recoveredBy })),
  ].filter((e) => e.key);

  if (entries.length === 0) return <p>삭제된 항목이 없습니다.</p>;

  return (
    <ul className="ui-list" data-testid="deleted-list">
      {entries.map((e) => {
        const recovered = Boolean(e.key && flags[e.key]);
        return (
          <li key={e.id}>
            <div>{recovered ? e.title : '삭제된 항목'}</div>
            <small>{recovered ? e.body : '복구되지 않았습니다. 복구 방법을 찾아야 한다.'}</small>
          </li>
        );
      })}
    </ul>
  );
}
