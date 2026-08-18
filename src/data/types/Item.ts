import type { EventEffect } from './Event';

export type ItemCategory = 'item' | 'evidence' | 'special';

export interface Item {
  id: string;
  name: string;
  description?: string;
  /** 인벤토리 탭 분류 (기본 item) */
  category?: ItemCategory;
  /** 사용 시 적용할 효과 — 수치는 데이터에 둔다 */
  onUseEffects?: EventEffect[];
  /** 사용이 이벤트를 트리거할 수 있다 */
  onUseEvent?: string;
  /** 사용 시 정신력 회복량 (gamd.md 8장) */
  mentalRecover?: number;
  /** 사용 후 소모되는가 */
  consumable?: boolean;
}

export type ItemFile = Record<string, Item>;
