'use client';

import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import MessageList from './MessageList';
import RecordNote from './RecordNote';
import PhotoList from './PhotoList';
import VoiceMemo from './VoiceMemo';
import DeletedList from './DeletedList';
import type { Note, PhoneMessage, PhonePhoto, VoiceMemoData } from '@/data/types';

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
  messages: PhoneMessage[];
  deletedMessages: PhoneMessage[];
  notes: Note[];
  photos: PhonePhoto[];
  memos: VoiceMemoData[];
  deletedMemos: VoiceMemoData[];
  flags: Record<string, boolean>;
  unread: number;
  onReadMessages: () => void;
}

export default function Phone({
  open, onClose, messages, deletedMessages, notes, photos, memos, deletedMemos, flags, unread, onReadMessages,
}: Props) {
  const [tab, setTab] = useState<Tab>('messages');

  // 문자 탭을 보고 있으면 미읽음 배지를 지운다
  useEffect(() => {
    if (open && tab === 'messages' && unread > 0) onReadMessages();
  }, [open, tab, unread, onReadMessages]);

  return (
    <Modal title="휴대폰" open={open} onClose={onClose}>
      <nav className="ui-tabs">
        {TABS.map((t) => (
          <Button key={t.id} onClick={() => setTab(t.id)} disabled={tab === t.id}>
            {t.label}
            {t.id === 'messages' && unread > 0 ? ` (${unread})` : ''}
          </Button>
        ))}
      </nav>
      <div className="ui-tab-body">
        {tab === 'messages' && <MessageList messages={messages} />}
        {tab === 'notes' && <RecordNote notes={notes} />}
        {tab === 'photos' && <PhotoList photos={photos} />}
        {tab === 'memos' && <VoiceMemo memos={memos} />}
        {tab === 'deleted' && <DeletedList messages={deletedMessages} memos={deletedMemos} flags={flags} />}
      </div>
    </Modal>
  );
}
