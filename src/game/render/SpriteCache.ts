'use client';

export const FRAME_W = 48;
export const FRAME_H = 64;

const FACING_COLUMN = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
} as const;

export type SpriteFacing = keyof typeof FACING_COLUMN;

interface SpriteCharacter {
  id: string;
  sprite?: string;
}

const cache = new Map<string, HTMLImageElement | null>();
const pending = new Map<string, Promise<void>>();

const spriteTone = (paletteId: string) =>
  paletteId === 'night' || paletteId === 'corridor' ? 'night' : 'day';

const spriteKey = (characterId: string, paletteId: string) =>
  `${spriteTone(paletteId)}:${characterId}`;

export const facingColumn = (facing: SpriteFacing) => FACING_COLUMN[facing];

/** 이미 받아 둔 맵용 도트 스프라이트 시트를 반환한다. */
export const sprite = (characterId: string, paletteId = 'day'): HTMLImageElement | null =>
  cache.get(spriteKey(characterId, paletteId)) ?? null;

export function preloadSprite(character: SpriteCharacter, paletteId = 'day'): Promise<void> {
  const key = spriteKey(character.id, paletteId);
  if (cache.has(key)) return Promise.resolve();
  const already = pending.get(key);
  if (already) return already;

  const task = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(key, img);
      pending.delete(key);
      resolve();
    };
    img.onerror = () => {
      cache.set(key, null);
      pending.delete(key);
      resolve();
    };

    const folder = spriteTone(paletteId) === 'night' ? 'night/' : '';
    img.src = `/assets/images/characters/${folder}${character.sprite ?? `${character.id}.png`}`;
  });

  pending.set(key, task);
  return task;
}

export const preloadSprites = (characters: readonly SpriteCharacter[], paletteId = 'day') =>
  Promise.all(characters.map((character) => preloadSprite(character, paletteId))).then(() => undefined);
