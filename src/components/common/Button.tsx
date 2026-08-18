'use client';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Button({ children, onClick, disabled }: Props) {
  return (
    <button type="button" className="ui-button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
