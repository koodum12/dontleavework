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
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onMute: (m: boolean) => void;
}

export default function GameMenu({
  open, onClose, onSave, onLoad, onTitle, hasSave, volume, muted, onVolume, onMute,
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

      <div className="menu-audio">
        <label htmlFor="volume">사운드 {muted ? '(음소거)' : `${Math.round(volume * 100)}%`}</label>
        <input
          id="volume" type="range" min={0} max={100} value={Math.round(volume * 100)}
          onChange={(e) => onVolume(Number(e.target.value) / 100)}
        />
        <Button onClick={() => onMute(!muted)}>{muted ? '음소거 해제' : '음소거'}</Button>
      </div>

      {status && <p className="menu-status" data-testid="menu-status">{status}</p>}
    </Modal>
  );
}
