'use client';

import Button from '../common/Button';
import type { Item as ItemData } from '@/data/types';

interface Props {
  item: ItemData;
  onUse?: (itemId: string) => void;
}

const usable = (item: ItemData) => Boolean(item.onUseEffects?.length || item.onUseEvent);

export default function Item({ item, onUse }: Props) {
  return (
    <li className="ui-item" data-testid={`item-${item.id}`}>
      <div>{item.name}</div>
      {item.description && <small>{item.description}</small>}
      {onUse && (
        <Button disabled={!usable(item)} onClick={() => onUse(item.id)}>
          {usable(item) ? '사용' : '사용할 수 없음'}
        </Button>
      )}
    </li>
  );
}
