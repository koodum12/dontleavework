'use client';

import { useState } from 'react';
import type { PhoneMessage } from '@/data/types';

export default function MessageList({ messages }: { messages: PhoneMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (messages.length === 0) return <p>받은 문자가 없습니다.</p>;

  return (
    <ul className="ui-list" data-testid="message-list">
      {messages.map((m) => (
        <li key={m.id}>
          <button type="button" className="ui-message" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
            <strong>{m.from}</strong> <span>{m.time}</span>
            <div>{m.text}</div>
          </button>
          {openId === m.id && m.detail && (
            <dl className="ui-debug">
              {Object.entries(m.detail).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ul>
  );
}
