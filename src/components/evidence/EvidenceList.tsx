'use client';

import { useState } from 'react';
import Button from '../common/Button';
import EvidenceDetail from './EvidenceDetail';
import type { Evidence, EvidenceCategory } from '@/data/types';

const TABS: { id: EvidenceCategory; label: string }[] = [
  { id: 'MEMORY', label: 'MEMORY' },
  { id: 'character', label: '인물 관련' },
  { id: 'case', label: '사건 관련' },
];

interface Props {
  evidence: Evidence[];
  /** 인물별 단서 (진 엔딩 조건이 인물 수로 걸려 있어 함께 보여 준다) */
  characterClues?: Record<string, string[]>;
  characterNames?: Record<string, string>;
}

export default function EvidenceList({ evidence, characterClues = {}, characterNames = {} }: Props) {
  const [tab, setTab] = useState<EvidenceCategory>('MEMORY');
  const [selected, setSelected] = useState<string | null>(null);

  const list = evidence.filter((e) => e.category === tab);
  const detail = evidence.find((e) => e.id === selected) ?? null;

  return (
    <div data-testid="evidence-list">
      <nav className="ui-tabs">
        {TABS.map((t) => {
          const count = evidence.filter((e) => e.category === t.id).length;
          return (
            <Button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }} disabled={tab === t.id}>
              {t.label} ({count})
            </Button>
          );
        })}
      </nav>

      {list.length === 0 ? (
        <p>이 분류의 증거가 없습니다.</p>
      ) : (
        <ul className="ui-list">
          {list.map((e) => (
            <li key={e.id}>
              <Button disabled={e.id === selected} onClick={() => setSelected(e.id)}>{e.name}</Button>
            </li>
          ))}
        </ul>
      )}

      <EvidenceDetail evidence={detail} />

      {tab === 'character' && (
        <div className="ui-clues">
          <h4>인물별 단서</h4>
          {Object.entries(characterClues).filter(([, c]) => c.length > 0).length === 0 ? (
            <p>확보한 인물 단서가 없습니다.</p>
          ) : (
            <ul className="ui-list" data-testid="character-clues">
              {Object.entries(characterClues)
                .filter(([, clues]) => clues.length > 0)
                .map(([id, clues]) => (
                  <li key={id}>
                    <b>{characterNames[id] ?? id}</b>
                    <ul>{clues.map((c) => <li key={c}>{c}</li>)}</ul>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
