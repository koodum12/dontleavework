import type { Condition } from './Condition';

export interface Rect { x: number; y: number; w: number; h: number }

export type Facing = 'up' | 'down' | 'left' | 'right';

export interface TravelBlock {
  /** 모든 조건이 참인 동안 이 이동을 막는다. 여러 블록 중 첫 번째 일치 항목을 사용한다. */
  conditions: Condition[];
  lockedText: string;
}

export interface TravelTarget {
  to: string;
  spawn?: string;
  conditions?: Condition[];
  lockedText?: string;
  blocks?: TravelBlock[];
}

export interface MapObject extends Rect {
  id: string;
  label: string;        // "책상", "정수기"
  solid: boolean;       // 충돌 여부
  eventId?: string;     // E 상호작용 시 실행할 이벤트
  travel?: TravelTarget;// 문/엘리베이터처럼 다른 맵으로 이동
  once?: boolean;       // true면 1회 실행 후 비활성
  conditions?: Condition[];
}

/**
 * 맵에 서 있는 사람. 가구가 사람 대역을 하지 않도록 오브젝트와 분리한다.
 * 크기는 스프라이트 논리 규격(24×32)에 맞춘다 — assets/images/README.md
 */
export interface MapNpc extends Rect {
  id: string;
  characterId: string;  // characters.json 의 키 — 이름 · 색 · 스프라이트의 출처
  location: string;
  label: string;        // 상호작용 프롬프트 ("팀장에게 말을 건다")
  facing: Facing;       // 서 있는 방향 (스프라이트 열 선택)
  solid: boolean;
  eventId?: string;
  idle?: string;
  once?: boolean;
  conditions?: Condition[];
}

export interface MapVariant {
  id: string;
  palette: string;
  nameSuffix?: string;
  conditions?: Condition[];
}

export interface MapPalette {
  floor: string;
  floorAlt?: string;
  grid: string;
  wall: string;
  wallEdge?: string;
  wallHighlight?: string;
  object: string;
  objectSoft?: string;
  outline?: string;
  shadow?: string;
  light?: string;
  monitor?: string;
  metal?: string;
  plant?: string;
  accent?: string;
}

export interface GameMap {
  id: string;           // "office"
  name: string;
  palette: string;
  width: number;        // 맵 전체 px
  height: number;
  spawn: { x: number; y: number };
  spawns?: Record<string, { x: number; y: number }>;
  walls: Rect[];
  objects: MapObject[];
  variants?: MapVariant[];
  labels?: { text: string; x: number; y: number }[];
  /** 조건 평가가 끝난 런타임 맵에만 채운다. 원본 배치는 npcs.json 에 있다. */
  npcs?: MapNpc[];
}

export type LocationFile = Record<string, GameMap>;
export type NpcFile = Record<string, MapNpc>;
export type PaletteFile = Record<string, MapPalette>;
