'use client';

export default function InteractionPrompt({ prompt }: { prompt: string | null }) {
  if (!prompt) return null;
  return <div className="ui-prompt">E - {prompt} 조사하기</div>;
}
