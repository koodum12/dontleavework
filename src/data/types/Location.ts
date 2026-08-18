export interface Rect { x: number; y: number; w: number; h: number }

export interface MapObject extends Rect {
  id: string;
  label: string;        // "책상", "정수기"
  solid: boolean;       // 충돌 여부
  eventId?: string;     // E 상호작용 시 실행할 이벤트 (Day 2에서 연결)
  once?: boolean;
}

export interface GameMap {
  id: string;           // "office"
  width: number;        // 맵 전체 px
  height: number;
  spawn: { x: number; y: number };
  walls: Rect[];
  objects: MapObject[];
}

export type LocationFile = Record<string, GameMap>;
