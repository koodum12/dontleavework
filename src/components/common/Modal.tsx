'use client';

import type { ReactNode } from 'react';
import Button from './Button';

interface Props {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="ui-modal-backdrop">
      <div className="ui-modal">
        <header className="ui-modal-header">
          <h2>{title}</h2>
          <Button onClick={onClose}>닫기</Button>
        </header>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
}
