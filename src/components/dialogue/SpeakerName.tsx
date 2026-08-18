'use client';

export default function SpeakerName({ name }: { name?: string }) {
  if (!name) return null;
  return <div className="ui-speaker">{name}</div>;
}
