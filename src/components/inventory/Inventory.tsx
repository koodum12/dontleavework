'use client';

import Modal from '../common/Modal';
import Item from './Item';
import type { Item as ItemData } from '@/data/types';

interface Props {
  open: boolean;
  onClose: () => void;
  items: ItemData[];
  onUse?: (itemId: string) => void;
}

export default function Inventory({ open, onClose, items, onUse }: Props) {
  return (
    <Modal title="인벤토리" open={open} onClose={onClose}>
      {items.length === 0 ? (
        <p>가진 물건이 없습니다.</p>
      ) : (
        <ul className="ui-list">
          {items.map((item) => (
            <Item key={item.id} item={item} onUse={onUse} />
          ))}
        </ul>
      )}
    </Modal>
  );
}
