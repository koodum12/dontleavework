'use client';

export interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
}

export default function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) return <p>받은 문자가 없습니다.</p>;
  return (
    <ul className="ui-list">
      {messages.map((m) => (
        <li key={m.id}>
          <strong>{m.from}</strong> <span>{m.time}</span>
          <div>{m.text}</div>
        </li>
      ))}
    </ul>
  );
}
