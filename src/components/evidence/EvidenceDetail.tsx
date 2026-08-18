'use client';

import type { Evidence } from '@/data/types';

export default function EvidenceDetail({ evidence }: { evidence: Evidence | null }) {
  if (!evidence) return <p>증거를 선택하세요.</p>;
  return (
    <div className="ui-evidence-detail">
      <h4>{evidence.name}</h4>
      <div>분류: {evidence.category}</div>
      {evidence.detail && <p>{evidence.detail}</p>}
    </div>
  );
}
