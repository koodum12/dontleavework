'use client';

import type { PhonePhoto } from '@/data/types';

export default function PhotoList({ photos }: { photos: PhonePhoto[] }) {
  if (photos.length === 0) return <p>사진이 없습니다.</p>;
  return (
    <ul className="ui-list" data-testid="photo-list">
      {photos.map((p) => (
        <li key={p.id}>
          <div>{p.title}</div>
          {p.description && <small>{p.description}</small>}
        </li>
      ))}
    </ul>
  );
}
