import type { GameMap } from '@/data/types';
import { VIEW_HEIGHT, VIEW_WIDTH } from '@/game/interaction/constants';

export interface Camera { x: number; y: number }

/**
 * 플레이어를 화면 중앙에 두되 맵 경계에서 클램프한다.
 * (맵이 뷰보다 작으면 가운데 정렬해 검은 여백이 한쪽으로 몰리지 않게 한다)
 */
export function computeCamera(
  player: { x: number; y: number },
  map: GameMap,
  viewW = VIEW_WIDTH,
  viewH = VIEW_HEIGHT,
): Camera {
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const x = map.width <= viewW
    ? (map.width - viewW) / 2
    : clamp(player.x - viewW / 2, 0, map.width - viewW);
  const y = map.height <= viewH
    ? (map.height - viewH) / 2
    : clamp(player.y - viewH / 2, 0, map.height - viewH);
  return { x, y };
}
