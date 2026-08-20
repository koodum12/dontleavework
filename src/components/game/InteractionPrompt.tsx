'use client';

/** 가구는 "조사하기", 사람은 "말 걸기" — 사람을 조사한다고 쓰지 않는다 */
export default function InteractionPrompt({
  prompt,
  kind = 'object',
}: {
  prompt: string | null;
  kind?: 'object' | 'npc';
}) {
  if (!prompt) return null;
  return <div className="ui-prompt">E - {prompt}{kind === 'npc' ? '에게 말 걸기' : ' 조사하기'}</div>;
}
