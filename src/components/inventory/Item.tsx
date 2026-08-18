'use client';

import Button from '../common/Button';
import type { Item as ItemData } from '@/data/types';

interface Props {
  item: ItemData;
  onUse?: (itemId: string) => void;
}

export default function Item({ item, onUse }: Props) {
  return (
    <li className="ui-item">
      <div>{item.name}</div>
      {item.description && <small>{item.description}</small>}
      {onUse && <Button onClick={() => onUse(item.id)}>사용</Button>}
    </li>
  );
}
