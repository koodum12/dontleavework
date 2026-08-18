'use client';

import type { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
}

export default function Panel({ title, children }: Props) {
  return (
    <section className="ui-panel">
      {title && <h3 className="ui-panel-title">{title}</h3>}
      {children}
    </section>
  );
}
