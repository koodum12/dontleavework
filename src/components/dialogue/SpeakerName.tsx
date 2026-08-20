'use client';

export default function SpeakerName({ name, color }: { name?: string; color?: string }) {
  if (!name) return null;
  return <div className="ui-speaker" style={color ? { color } : undefined}>{name}</div>;
}
