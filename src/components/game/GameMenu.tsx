'use client';

import Modal from '../common/Modal';
import Button from '../common/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  onLoad?: () => void;
}

export default function GameMenu({ open, onClose, onSave, onLoad }: Props) {
  return (
    <Modal title="메뉴" open={open} onClose={onClose}>
      <ul className="ui-list">
        <li><Button onClick={onClose}>계속하기</Button></li>
        <li><Button onClick={onSave} disabled={!onSave}>저장 (Day 4)</Button></li>
        <li><Button onClick={onLoad} disabled={!onLoad}>불러오기 (Day 4)</Button></li>
      </ul>
    </Modal>
  );
}
