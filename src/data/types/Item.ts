export interface Item {
  id: string;
  name: string;
  description?: string;
  /** 사용 시 정신력 회복량 (gamd.md 8장) */
  mentalRecover?: number;
  /** 사용 후 소모되는가 */
  consumable?: boolean;
}

export type ItemFile = Record<string, Item>;
