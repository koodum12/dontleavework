import type { CharacterFile, MapObject, MapPalette } from '@/data/types';
import type { Player } from '@/game/player/PlayerController';
import type { ResolvedGameMap } from '@/game/map/resolveMap';
import type { Camera } from './Camera';
import { PLAYER_SIZE, TILE, VIEW_HEIGHT, VIEW_WIDTH } from '@/game/interaction/constants';
import { FRAME_H, FRAME_W, facingColumn, sprite, type SpriteFacing } from './SpriteCache';

const COMMON = {
  nearest: '#d6b36a',
  player: '#e0e4ea',
  facing: '#9ec7d6',
  npcFallback: '#9aa0aa',
  skin: '#c8a891',
  hair: '#2c2728',
};

export interface RenderInput {
  map: ResolvedGameMap;
  player: Player;
  camera: Camera;
  nearestObjectId?: string | null;
  characters?: CharacterFile;
  playerWalkFrame?: number;
}

function drawPerson(
  ctx: CanvasRenderingContext2D,
  characterId: string,
  facing: SpriteFacing,
  frame: number,
  paletteId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  const sheet = sprite(characterId, paletteId);
  const drawX = Math.round(x);
  const drawY = Math.round(y);
  const drawW = Math.round(w);
  const drawH = Math.round(h);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(3, 5, 8, 0.45)';
  ctx.fillRect(drawX + 4, drawY + drawH - 2, Math.max(8, drawW - 8), 3);

  if (sheet) {
    ctx.drawImage(
      sheet,
      facingColumn(facing) * FRAME_W,
      Math.max(0, Math.min(1, frame)) * FRAME_H,
      FRAME_W,
      FRAME_H,
      drawX,
      drawY,
      drawW,
      drawH,
    );
    ctx.restore();
    return;
  }

  const centerX = drawX + Math.floor(drawW / 2);
  const headW = Math.max(6, Math.floor(drawW * 0.45));
  const headH = Math.max(7, Math.floor(drawH * 0.3));
  const headX = centerX - Math.floor(headW / 2);
  const headY = drawY + 3;
  const torsoX = drawX + Math.floor(drawW * 0.2);
  const torsoY = headY + headH - 1;
  const torsoW = Math.max(8, drawW - Math.floor(drawW * 0.4));
  const torsoH = Math.max(10, drawH - (torsoY - drawY) - 2);

  ctx.fillStyle = COMMON.hair;
  ctx.fillRect(headX - 1, headY, headW + 2, Math.ceil(headH * 0.45));
  ctx.fillStyle = COMMON.skin;
  ctx.fillRect(headX, headY + Math.floor(headH * 0.35), headW, Math.ceil(headH * 0.65));
  ctx.fillStyle = color;
  ctx.fillRect(torsoX, torsoY, torsoW, torsoH);

  const offsets: Record<SpriteFacing, [number, number]> = {
    up: [0, -2], down: [0, 2], left: [-2, 0], right: [2, 0],
  };
  const [ox, oy] = offsets[facing];
  ctx.fillStyle = COMMON.facing;
  ctx.fillRect(centerX + ox - 1, headY + Math.floor(headH * 0.64) + oy, 2, 2);
  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 6,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
}

function fillObjectBase(ctx: CanvasRenderingContext2D, object: MapObject, palette: MapPalette) {
  const { x, y, w, h } = object;
  ctx.save();
  ctx.fillStyle = palette.shadow ?? '#101216';
  roundedRect(ctx, x + 5, y + 7, w, h, 7);
  ctx.fill();

  const surface = ctx.createLinearGradient(x, y, x, y + h);
  surface.addColorStop(0, object.solid ? palette.objectSoft ?? palette.object : palette.wallEdge ?? palette.wall);
  surface.addColorStop(0.16, object.solid ? palette.object : palette.objectSoft ?? palette.object);
  surface.addColorStop(1, palette.object);
  ctx.fillStyle = surface;
  roundedRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = palette.outline ?? '#191b1f';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, 5.5);
  ctx.stroke();
  ctx.strokeStyle = palette.wallHighlight ?? 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 4.5);
  ctx.lineTo(x + w - 7, y + 4.5);
  ctx.stroke();
  ctx.restore();
}

/** 사각형 배치 데이터에 최소한의 가구 형태를 더해 랜드마크가 실제로 구분되게 한다. */
function drawObject(ctx: CanvasRenderingContext2D, object: MapObject, palette: MapPalette) {
  const { x, y, w, h, id } = object;
  if (id.includes('desk') || id.includes('console')) {
    ctx.fillStyle = palette.shadow ?? '#101216';
    roundedRect(ctx, x + w * 0.38 + 3, y + h - 4, w * 0.24, 26, 8);
    ctx.fill();
    ctx.fillStyle = palette.metal ?? palette.wallEdge ?? '#717986';
    roundedRect(ctx, x + w * 0.38, y + h - 8, w * 0.24, 22, 8);
    ctx.fill();
  }
  fillObjectBase(ctx, object, palette);

  if (id.includes('elevator')) {
    const metal = ctx.createLinearGradient(x, y, x + w, y);
    metal.addColorStop(0, palette.wallEdge ?? '#717986');
    metal.addColorStop(0.5, palette.metal ?? '#9ba1a5');
    metal.addColorStop(1, palette.wallEdge ?? '#717986');
    ctx.fillStyle = metal;
    roundedRect(ctx, x + 7, y + 6, w - 14, h - 12, 3);
    ctx.fill();
    ctx.fillStyle = palette.outline ?? '#191b1f';
    ctx.fillRect(x + w / 2 - 1, y + 7, 2, h - 14);
    ctx.fillStyle = palette.light ?? '#d3c39a';
    ctx.fillRect(x + w - 12, y + h / 2 - 3, 4, 6);
    return;
  }

  if (id.includes('door') || id.includes('gate')) {
    ctx.fillStyle = palette.wallEdge ?? palette.wall;
    roundedRect(ctx, x + 5, y + 5, w - 10, h - 10, 4);
    ctx.fill();
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    roundedRect(ctx, x + 11, y + 10, w - 22, h - 16, 3);
    ctx.fill();
    ctx.fillStyle = palette.light ?? '#d3c39a';
    ctx.beginPath();
    ctx.arc(x + w - 18, y + h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (id.includes('desk') || id.includes('console')) {
    ctx.fillStyle = palette.wallHighlight ?? 'rgba(255,255,255,0.14)';
    roundedRect(ctx, x + 7, y + 6, w - 14, 7, 2);
    ctx.fill();
    ctx.fillStyle = palette.monitor ?? '#7395a3';
    const dual = id.includes('team_leader') || id.includes('control');
    const monitorW = dual ? w * 0.28 : w * 0.44;
    const monitorY = y + 15;
    const monitorXs = dual ? [x + w * 0.18, x + w * 0.54] : [x + (w - monitorW) / 2];
    for (const monitorX of monitorXs) {
      roundedRect(ctx, monitorX, monitorY, monitorW, Math.min(20, h * 0.34), 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,245,247,0.2)';
      ctx.fillRect(monitorX + 4, monitorY + 3, monitorW - 8, 2);
      ctx.fillStyle = palette.monitor ?? '#7395a3';
    }
    ctx.fillStyle = palette.outline ?? '#191b1f';
    ctx.fillRect(x + w * 0.49, y + 34, 3, 7);
    roundedRect(ctx, x + w * 0.32, y + 44, w * 0.36, 5, 2);
    ctx.fill();
    ctx.fillStyle = palette.metal ?? palette.wallEdge ?? '#717986';
    ctx.fillRect(x + 10, y + h - 10, 5, 10);
    ctx.fillRect(x + w - 15, y + h - 10, 5, 10);
    return;
  }

  if (id === 'obj_coffee') {
    ctx.fillStyle = palette.light ?? '#d3c39a';
    roundedRect(ctx, x + 6, y + 4, 11, 16, 3);
    ctx.fill();
    ctx.fillStyle = palette.outline ?? '#191b1f';
    roundedRect(ctx, x + 7, y + 2, 9, 3, 1.5);
    ctx.fill();
    ctx.strokeStyle = palette.light ?? '#d3c39a';
    ctx.strokeRect(x + 16.5, y + 8.5, 4, 7);
    return;
  }

  if (id === 'obj_printed_photo') {
    ctx.fillStyle = '#d9d4c8';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#555a61';
    ctx.fillRect(x + 5, y + 5, w - 10, h - 12);
    ctx.fillStyle = '#a06158';
    ctx.fillRect(x + w - 7, y + h - 7, 3, 3);
    return;
  }

  if (id.includes('printer')) {
    ctx.fillStyle = '#777d84';
    roundedRect(ctx, x + 7, y + 7, w - 14, h - 14, 4);
    ctx.fill();
    ctx.fillStyle = palette.outline ?? '#191b1f';
    ctx.fillRect(x + 14, y + 19, w - 28, 5);
    ctx.fillStyle = '#d8d5c9';
    ctx.fillRect(x + 17, y + 3, w - 34, 10);
    return;
  }

  if (id.includes('water')) {
    ctx.fillStyle = '#aeb9ba';
    roundedRect(ctx, x + 9, y + 4, w - 18, 15, 5);
    ctx.fill();
    ctx.fillStyle = palette.monitor ?? '#7395a3';
    ctx.fillRect(x + 12, y + 7, w - 24, 9);
    ctx.fillStyle = palette.outline ?? '#191b1f';
    ctx.fillRect(x + 6, y + 24, w - 12, 4);
    return;
  }

  if (id.includes('cctv')) {
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const cellW = Math.max(24, (w - 18) / 2);
        const cellH = Math.max(15, (h - 18) / 2);
        const cellX = x + 5 + col * (cellW + 4);
        const cellY = y + 5 + row * (cellH + 4);
        ctx.fillStyle = palette.monitor ?? '#7395a3';
        roundedRect(ctx, cellX, cellY, cellW, cellH, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(224,244,246,0.24)';
        ctx.beginPath();
        ctx.moveTo(cellX + 5, cellY + cellH - 5);
        ctx.lineTo(cellX + cellW * 0.48, cellY + cellH * 0.44);
        ctx.lineTo(cellX + cellW - 5, cellY + 7);
        ctx.stroke();
      }
    }
    return;
  }

  if (id.includes('bed')) {
    ctx.fillStyle = '#d6d0c6';
    roundedRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
    ctx.fill();
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    roundedRect(ctx, x + 16, y + 14, 54, 26, 7);
    ctx.fill();
    ctx.fillStyle = palette.wallEdge ?? palette.wall;
    ctx.fillRect(x + 8, y + h - 24, w - 16, 16);
    return;
  }

  if (id.includes('sofa')) {
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    roundedRect(ctx, x + 8, y + 10, w - 16, h - 18, 10);
    ctx.fill();
    ctx.fillStyle = palette.object;
    roundedRect(ctx, x + 15, y + 18, w / 2 - 18, h - 30, 6);
    ctx.fill();
    roundedRect(ctx, x + w / 2 + 3, y + 18, w / 2 - 18, h - 30, 6);
    ctx.fill();
    return;
  }

  if (id.includes('table')) {
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    roundedRect(ctx, x + 6, y + 6, w - 12, h - 12, id.includes('cafe') ? 16 : 8);
    ctx.fill();
    ctx.strokeStyle = palette.wallHighlight ?? 'rgba(255,255,255,0.15)';
    roundedRect(ctx, x + 12, y + 12, w - 24, h - 24, id.includes('cafe') ? 11 : 4);
    ctx.stroke();
    ctx.fillStyle = palette.outline ?? '#191b1f';
    ctx.fillRect(x + 12, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 20, y + h - 10, 8, 10);
    return;
  }

  if (id.includes('window')) {
    const glass = ctx.createLinearGradient(x, y, x + w, y + h);
    glass.addColorStop(0, palette.monitor ?? '#7395a3');
    glass.addColorStop(0.48, palette.monitor ?? '#7395a3');
    glass.addColorStop(0.5, 'rgba(220,238,240,0.34)');
    glass.addColorStop(1, palette.floorAlt ?? palette.monitor ?? '#7395a3');
    ctx.fillStyle = glass;
    roundedRect(ctx, x + 5, y + 5, w - 10, h - 10, 3);
    ctx.fill();
    ctx.fillStyle = palette.outline ?? '#191b1f';
    ctx.fillRect(x + w / 2 - 1, y + 5, 2, h - 10);
    return;
  }

  if (id.includes('counter')) {
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    ctx.fillRect(x + 8, y + 8, w - 16, 18);
    ctx.fillStyle = palette.outline ?? '#191b1f';
    for (let px = x + 22; px < x + w - 12; px += 54) ctx.fillRect(px, y + 34, 26, 5);
    return;
  }

  if (id.includes('machine')) {
    ctx.fillStyle = '#737a7b';
    ctx.fillRect(x + 8, y + 6, w - 16, h - 12);
    ctx.fillStyle = palette.monitor ?? '#7395a3';
    ctx.fillRect(x + 18, y + 12, w - 36, 10);
    return;
  }

  if (id.includes('bus_stop')) {
    ctx.fillStyle = palette.wallEdge ?? palette.wall;
    ctx.fillRect(x + 8, y + 5, 7, h - 10);
    ctx.fillRect(x + w - 15, y + 5, 7, h - 10);
    ctx.fillRect(x + 8, y + 5, w - 16, 7);
    ctx.fillStyle = palette.monitor ?? '#7395a3';
    ctx.fillRect(x + 24, y + 16, w - 48, h - 28);
    return;
  }

  if (id.includes('bench')) {
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    ctx.fillRect(x + 6, y + 8, w - 12, 10);
    ctx.fillRect(x + 6, y + 24, w - 12, 8);
    return;
  }

  if (id.includes('lamp')) {
    ctx.fillStyle = palette.wallEdge ?? palette.wall;
    ctx.fillRect(x + w / 2 - 4, y + 20, 8, h - 20);
    ctx.fillStyle = palette.light ?? '#d3c39a';
    ctx.fillRect(x + 7, y + 5, w - 14, 20);
    return;
  }

  if (id.includes('plant')) {
    ctx.fillStyle = palette.plant ?? '#486452';
    for (let leaf = 0; leaf < 5; leaf += 1) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2 + (leaf - 2) * 6, y + 20 + Math.abs(leaf - 2) * 3, 9, 21, (leaf - 2) * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = palette.object;
    roundedRect(ctx, x + 8, y + h - 22, w - 16, 18, 5);
    ctx.fill();
    return;
  }

  if (id.includes('cabinet')) {
    ctx.fillStyle = palette.wallEdge ?? palette.wall;
    for (let row = 0; row < 3; row += 1) {
      ctx.fillRect(x + 8, y + 8 + row * ((h - 16) / 3), w - 16, (h - 24) / 3);
    }
    return;
  }

  if (id.includes('cart')) {
    ctx.fillStyle = palette.objectSoft ?? palette.object;
    ctx.fillRect(x + 10, y + 12, w - 20, h - 22);
    ctx.fillStyle = palette.light ?? '#d3c39a';
    ctx.fillRect(x + 20, y + 4, 7, 20);
  }
}

function drawFloorPattern(ctx: CanvasRenderingContext2D, map: ResolvedGameMap) {
  const palette = map.resolvedPalette;
  ctx.save();

  if (map.id === 'home' || map.id === 'cafe') {
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let y = 32; y < map.height - 32; y += 24) {
      ctx.beginPath();
      ctx.moveTo(32, y + 0.5);
      ctx.lineTo(map.width - 32, y + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = palette.floorAlt ?? palette.objectSoft ?? palette.grid;
    for (let y = 44; y < map.height - 32; y += 48) {
      const offset = (Math.floor(y / 48) % 2) * 64;
      for (let x = 32 + offset; x < map.width - 32; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, y - 12);
        ctx.lineTo(x + 0.5, y + 12);
        ctx.stroke();
      }
    }
  } else if (map.id !== 'street') {
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.62;
    for (let x = 32; x <= map.width - 32; x += TILE * 2) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 32);
      ctx.lineTo(x + 0.5, map.height - 32);
      ctx.stroke();
    }
    for (let y = 32; y <= map.height - 32; y += TILE * 2) {
      ctx.beginPath();
      ctx.moveTo(32, y + 0.5);
      ctx.lineTo(map.width - 32, y + 0.5);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = palette.wallHighlight ?? '#ffffff';
  for (let y = 72; y < map.height - 32; y += 112) {
    for (let x = 58 + ((y / 112) % 2) * 37; x < map.width - 32; x += 137) {
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }
  ctx.restore();
}

function drawEnvironment(ctx: CanvasRenderingContext2D, map: ResolvedGameMap) {
  const palette = map.resolvedPalette;

  if (map.id === 'office') {
    ctx.fillStyle = palette.floorAlt ?? 'rgba(96, 106, 112, 0.18)';
    roundedRect(ctx, 48, 72, 560, 488, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(115, 150, 156, 0.08)';
    roundedRect(ctx, 688, 64, 208, 392, 8);
    ctx.fill();
  }
  if (map.id === 'street') {
    ctx.fillStyle = palette.floorAlt ?? '#171d20';
    ctx.fillRect(32, 224, map.width - 64, 176);
    ctx.fillStyle = palette.metal ?? palette.wallEdge ?? palette.wall;
    ctx.fillRect(32, 208, map.width - 64, 16);
    ctx.fillRect(32, 400, map.width - 64, 16);
    ctx.fillStyle = palette.light ?? '#d3c39a';
    for (let x = 72; x < map.width - 64; x += 120) {
      roundedRect(ctx, x, 307, 68, 5, 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(226,230,222,0.36)';
    for (let x = 424; x < 560; x += 22) ctx.fillRect(x, 224, 11, 58);
    ctx.strokeStyle = palette.grid;
    for (let x = 32; x < map.width - 32; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 32);
      ctx.lineTo(x + 0.5, 208);
      ctx.moveTo(x + 0.5, 416);
      ctx.lineTo(x + 0.5, map.height - 32);
      ctx.stroke();
    }
  }
  if (map.id === 'home') {
    ctx.fillStyle = palette.floorAlt ?? 'rgba(202, 154, 119, 0.12)';
    roundedRect(ctx, 336, 400, 240, 144, 12);
    ctx.fill();
    ctx.strokeStyle = palette.accent ?? palette.light ?? '#d2a968';
    ctx.lineWidth = 2;
    roundedRect(ctx, 346, 410, 220, 124, 9);
    ctx.stroke();
  }
  if (map.id === 'lobby') {
    ctx.fillStyle = palette.floorAlt ?? 'rgba(220, 224, 214, 0.06)';
    roundedRect(ctx, 272, 176, 416, 232, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(225,235,226,0.07)';
    roundedRect(ctx, 304, 192, 352, 200, 6);
    ctx.fill();
  }
  if (map.id === 'cafe') {
    const warm = ctx.createLinearGradient(0, 48, 0, 280);
    warm.addColorStop(0, 'rgba(231, 183, 109, 0.15)');
    warm.addColorStop(1, 'rgba(231, 183, 109, 0.015)');
    ctx.fillStyle = warm;
    ctx.fillRect(48, 48, 864, 232);
  }
  if (map.id === 'control_room') {
    const glow = ctx.createRadialGradient(224, 160, 20, 224, 160, 250);
    glow.addColorStop(0, 'rgba(66, 162, 179, 0.14)');
    glow.addColorStop(1, 'rgba(66, 162, 179, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(32, 32, 500, 360);
  }
  if (map.id === 'corridor' || map.resolvedPaletteId === 'night') {
    for (let x = 80; x < map.width - 64; x += 256) {
      const light = ctx.createRadialGradient(x + 72, 220, 18, x + 72, 220, 190);
      light.addColorStop(0, 'rgba(221, 203, 151, 0.10)');
      light.addColorStop(1, 'rgba(221, 203, 151, 0)');
      ctx.fillStyle = light;
      ctx.fillRect(x - 96, 32, 336, map.height - 64);
    }
  }
}

function drawFocus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const pad = 5;
  ctx.strokeStyle = COMMON.nearest;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - pad, y + 10); ctx.lineTo(x - pad, y - pad); ctx.lineTo(x + 10, y - pad);
  ctx.moveTo(x + w - 10, y - pad); ctx.lineTo(x + w + pad, y - pad); ctx.lineTo(x + w + pad, y + 10);
  ctx.moveTo(x + w + pad, y + h - 10); ctx.lineTo(x + w + pad, y + h + pad); ctx.lineTo(x + w - 10, y + h + pad);
  ctx.moveTo(x + 10, y + h + pad); ctx.lineTo(x - pad, y + h + pad); ctx.lineTo(x - pad, y + h - 10);
  ctx.stroke();
}

/** 바닥 → 벽 → 오브젝트 → y축 정렬된 사람 순서로 그린다. */
export function render(
  ctx: CanvasRenderingContext2D,
  {
    map, player, camera, nearestObjectId, characters = {}, playerWalkFrame = 0,
  }: RenderInput,
) {
  const palette = map.resolvedPalette;
  ctx.save();
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, 0, map.width, map.height);
  drawFloorPattern(ctx, map);
  drawEnvironment(ctx, map);

  ctx.fillStyle = palette.shadow ?? '#101216';
  for (const wall of map.walls) ctx.fillRect(wall.x + 4, wall.y + 5, wall.w, wall.h);
  for (const wall of map.walls) {
    const wallSurface = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
    wallSurface.addColorStop(0, palette.wallHighlight ?? palette.wallEdge ?? palette.wall);
    wallSurface.addColorStop(Math.min(1, 8 / Math.max(8, wall.h)), palette.wall);
    wallSurface.addColorStop(1, palette.wall);
    ctx.fillStyle = wallSurface;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = palette.wallEdge ?? palette.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, Math.min(3, wall.h));
    ctx.fillStyle = palette.outline ?? '#111318';
    ctx.fillRect(wall.x, wall.y + wall.h - 2, wall.w, Math.min(2, wall.h));
  }

  ctx.save();
  ctx.font = '600 10px ui-sans-serif, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  for (const label of map.labels ?? []) {
    const labelWidth = ctx.measureText(label.text).width + 16;
    ctx.fillStyle = 'rgba(8, 11, 14, 0.62)';
    roundedRect(ctx, label.x - 8, label.y - 11, labelWidth, 22, 4);
    ctx.fill();
    ctx.fillStyle = palette.light ?? palette.wallHighlight ?? palette.wallEdge ?? palette.wall;
    ctx.fillText(label.text, label.x, label.y + 0.5);
  }
  ctx.restore();

  for (const object of map.objects) {
    drawObject(ctx, object, palette);
    if (object.id === nearestObjectId) drawFocus(ctx, object.x, object.y, object.w, object.h);
  }

  const bodyH = PLAYER_SIZE * (4 / 3);
  const people = [
    ...(map.npcs ?? []).map((npc) => ({
      id: npc.id,
      characterId: npc.characterId,
      facing: npc.facing,
      frame: 0,
      x: npc.x,
      y: npc.y,
      w: npc.w,
      h: npc.h,
      bottom: npc.y + npc.h,
    })),
    {
      id: '__player',
      characterId: 'sarang',
      facing: player.facing,
      frame: playerWalkFrame,
      x: player.x - PLAYER_SIZE / 2,
      y: player.y + PLAYER_SIZE / 2 - bodyH,
      w: PLAYER_SIZE,
      h: bodyH,
      bottom: player.y + PLAYER_SIZE / 2,
    },
  ].sort((a, b) => a.bottom - b.bottom);

  for (const person of people) {
    const character = characters[person.characterId];
    drawPerson(
      ctx,
      person.characterId,
      person.facing,
      person.frame,
      map.resolvedPaletteId,
      person.x,
      person.y,
      person.w,
      person.h,
      character?.color ?? (person.id === '__player' ? COMMON.player : COMMON.npcFallback),
    );
    if (person.id === nearestObjectId) drawFocus(ctx, person.x, person.y, person.w, person.h);
  }

  ctx.restore();
}
