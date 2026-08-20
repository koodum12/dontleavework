import type { GameMap, MapNpc, MapPalette, NpcFile, PaletteFile } from '@/data/types';
import { evaluate } from '@/game/event/ConditionManager';
import type { GameStateData } from '@/game/state/gameStore';

export interface ResolvedGameMap extends GameMap {
  resolvedName: string;
  resolvedPaletteId: string;
  resolvedPalette: MapPalette;
  npcs: MapNpc[];
}

const FALLBACK_PALETTE: MapPalette = {
  floor: '#23262c',
  grid: '#2b2f36',
  wall: '#4a5058',
  object: '#6b563c',
};

/**
 * JSON 배치를 현재 게임 상태에 맞는 한 장면으로 바꾼다.
 * 같은 characterId 후보가 여럿이면 npcs.json 에 먼저 선언된 하나만 남는다.
 */
export function resolveMap(
  map: GameMap,
  npcFile: NpcFile,
  palettes: PaletteFile,
  state: GameStateData,
): ResolvedGameMap {
  const variant = map.variants?.find((candidate) => evaluate(candidate.conditions, state));
  const paletteId = variant?.palette ?? map.palette;
  const seenCharacters = new Set<string>();
  const npcs: MapNpc[] = [];

  for (const npc of Object.values(npcFile)) {
    if (npc.location !== map.id || !evaluate(npc.conditions, state)) continue;
    if (seenCharacters.has(npc.characterId)) continue;
    seenCharacters.add(npc.characterId);
    npcs.push(npc);
  }

  return {
    ...map,
    objects: map.objects.filter((object) => evaluate(object.conditions, state)),
    npcs,
    resolvedName: `${map.name}${variant?.nameSuffix ?? ''}`,
    resolvedPaletteId: paletteId,
    resolvedPalette: palettes[paletteId] ?? palettes[map.palette] ?? FALLBACK_PALETTE,
  };
}
