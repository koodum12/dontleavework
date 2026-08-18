'use client';

import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import MessageList, { type Message } from './MessageList';
import RecordNote from './RecordNote';
import VoiceMemo, { type Memo } from './VoiceMemo';
import type { Note } from '@/data/types';

type Tab = 'messages' | 'notes' | 'photos' | 'memos' | 'deleted';

const TABS: { id: Tab; label: string }[] = [
  { id: 'messages', label: '문자' },
  { id: 'notes', label: '기록 노트' },
  { id: 'photos', label: '사진' },
  { id: 'memos', label: '음성 메모' },
  { id: 'deleted', label: '삭제된 항목' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  notes: Note[];
  memos: Memo[];
  photos: string[];
}

export default function Phone({ open, onClose, messages, notes, memos, photos }: Props) {
  const [tab, setTab] = useState<Tab>('messages');

  return (
    <Modal title="휴대폰" open={open} onClose={onClose}>
      <nav className="ui-tabs">
        {TABS.map((t) => (
          <Button key={t.id} onClick={() => setTab(t.id)} disabled={tab === t.id}>
            {t.label}
          </Button>
        ))}
      </nav>
      <div className="ui-tab-body">
        {tab === 'messages' && <MessageList messages={messages} />}
        {tab === 'notes' && <RecordNote notes={notes} />}
        {tab === 'memos' && <VoiceMemo memos={memos} />}
        {tab === 'photos' &&
          (photos.length === 0 ? <p>사진이 없습니다.</p> : <ul className="ui-list">{photos.map((p) => <li key={p}>{p}</li>)}</ul>)}
        {tab === 'deleted' && <p>삭제된 항목이 없습니다.</p>}
      </div>
    </Modal>
  );
}
