'use client';

import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Item from './Item';
import EvidenceList from '../evidence/EvidenceList';
import type { Evidence, Item as ItemData } from '@/data/types';

type Tab = 'item' | 'evidence' | 'special';

const TABS: { id: Tab; label: string }[] = [
  { id: 'item', label: '아이템' },
  { id: 'evidence', label: '증거' },
  { id: 'special', label: '특수 자료' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  items: ItemData[];
  evidence: Evidence[];
  characterClues?: Record<string, string[]>;
  characterNames?: Record<string, string>;
  onUse?: (itemId: string) => void;
}

export default function Inventory({
  open, onClose, items, evidence, characterClues, characterNames, onUse,
}: Props) {
  const [tab, setTab] = useState<Tab>('item');
  const inTab = items.filter((i) => (i.category ?? 'item') === tab);

  return (
    <Modal title="인벤토리" open={open} onClose={onClose}>
      <nav className="ui-tabs">
        {TABS.map((t) => (
          <Button key={t.id} onClick={() => setTab(t.id)} disabled={tab === t.id}>{t.label}</Button>
        ))}
      </nav>

      {tab === 'evidence' ? (
        <EvidenceList evidence={evidence} characterClues={characterClues} characterNames={characterNames} />
      ) : inTab.length === 0 ? (
        <p>가진 것이 없습니다.</p>
      ) : (
        <ul className="ui-list">
          {inTab.map((item) => (
            <Item key={item.id} item={item} onUse={tab === 'item' ? onUse : undefined} />
          ))}
        </ul>
      )}
    </Modal>
  );
}
