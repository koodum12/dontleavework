'use client';

import Button from '../common/Button';
import type { Evidence } from '@/data/types';

interface Props {
  evidence: Evidence[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export default function EvidenceList({ evidence, selectedId, onSelect }: Props) {
  if (evidence.length === 0) return <p>확보한 증거가 없습니다.</p>;
  return (
    <ul className="ui-list">
      {evidence.map((e) => (
        <li key={e.id}>
          <Button disabled={e.id === selectedId} onClick={() => onSelect?.(e.id)}>
            [{e.category}] {e.name}
          </Button>
        </li>
      ))}
    </ul>
  );
}
