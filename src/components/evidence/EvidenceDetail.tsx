'use client';

import type { Evidence } from '@/data/types';

const CATEGORY_LABEL: Record<string, string> = {
  MEMORY: 'MEMORY',
  character: '인물 관련',
  case: '사건 관련',
};

export default function EvidenceDetail({ evidence }: { evidence: Evidence | null }) {
  if (!evidence) return <p className="ui-evidence-detail">증거를 선택하세요.</p>;
  return (
    <div className="ui-evidence-detail" data-testid="evidence-detail">
      <h4>{evidence.name}</h4>
      <div>분류: {CATEGORY_LABEL[evidence.category] ?? evidence.category}</div>
      {/* 증거 원문은 정신력 연출의 면역 구역 — 항상 원문 그대로 */}
      {evidence.detail && <p>{evidence.detail}</p>}
    </div>
  );
}
