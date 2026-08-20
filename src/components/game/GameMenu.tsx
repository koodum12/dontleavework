'use client';

import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onLoad: () => Promise<void>;
  onTitle: () => void;
  hasSave: boolean;
}

export default function GameMenu({
  open, onClose, onSave, onLoad, onTitle, hasSave,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<void>) => {
    setStatus(`${label} 중…`);
    try {
      await fn();
      setStatus(`${label} 완료`);
    } catch (e) {
      console.warn(`[GameMenu] ${label} 실패:`, e);
      setStatus(`${label} 실패`);
    }
  };

  return (
    <Modal title="메뉴" open={open} onClose={onClose}>
      <ul className="ui-list">
        <li><Button onClick={onClose}>계속하기</Button></li>
        <li><Button onClick={() => run('저장', onSave)}>저장</Button></li>
        <li><Button disabled={!hasSave} onClick={() => run('불러오기', onLoad)}>불러오기</Button></li>
        <li><Button onClick={onTitle}>타이틀로</Button></li>
      </ul>

      {status && <p className="menu-status" data-testid="menu-status">{status}</p>}
    </Modal>
  );
}
