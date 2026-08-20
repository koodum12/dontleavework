'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { CharacterFile, GameMap, NpcFile, PaletteFile } from '@/data/types';
import { createPlayer, movePlayer, solidRects, type Player } from '@/game/player/PlayerController';
import type { InputController } from '@/game/player/InputController';
import { findNearest, type NearestResult } from '@/game/interaction/InteractionManager';
import { computeCamera } from '@/game/render/Camera';
import { render } from '@/game/render/Renderer';
import { preloadSprites } from '@/game/render/SpriteCache';
import { startGameLoop } from '@/game/render/GameLoop';
import { resolveMap, type ResolvedGameMap } from '@/game/map/resolveMap';
import { VIEW_HEIGHT, VIEW_WIDTH } from '@/game/interaction/constants';
import { useUIStore } from '@/game/state/uiStore';
import { gameStateSnapshot, useGameStore } from '@/game/state/gameStore';
import { useEventStore } from '@/game/event/EventManager';

interface Props {
  input: InputController;
  map?: GameMap;
  spawnKey?: string | null;
  npcs: NpcFile;
  palettes: PaletteFile;
  characters: CharacterFile;
  onNearestChange: (target: NearestResult | null) => void;
  onLocationChange: (name: string) => void;
}

/** 조건부 데이터까지 해석한 범용 2D 탑다운 맵 씬. */
export default function Office({
  input,
  map,
  spawnKey,
  npcs,
  palettes,
  characters,
  onNearestChange,
  onLocationChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nearestRef = useRef(onNearestChange);
  nearestRef.current = onNearestChange;

  // 맵 조건이 지원하는 상태가 바뀔 때만 장면을 다시 해석한다.
  const flags = useGameStore((state) => state.flags);
  const inventory = useGameStore((state) => state.inventory);
  const evidence = useGameStore((state) => state.evidence);
  const characterClues = useGameStore((state) => state.characterClues);
  const mental = useGameStore((state) => state.mental);

  const conditionState = useMemo(() => ({
    ...gameStateSnapshot(), flags, inventory, evidence, characterClues, mental,
  }), [flags, inventory, evidence, characterClues, mental]);
  const resolved = useMemo(
    () => (map ? resolveMap(map, npcs, palettes, conditionState) : null),
    [map, npcs, palettes, conditionState],
  );
  const activeMapRef = useRef<ResolvedGameMap | null>(resolved);
  const solidsRef = useRef(resolved ? solidRects(resolved) : []);
  activeMapRef.current = resolved;
  solidsRef.current = resolved ? solidRects(resolved) : [];

  useEffect(() => {
    if (!resolved) return;
    onLocationChange(resolved.resolvedName);
    const ids = new Set(['sarang', ...resolved.npcs.map((npc) => npc.characterId)]);
    const visibleCharacters = [...ids].map((id) => characters[id] ?? { id });
    void preloadSprites(visibleCharacters, resolved.resolvedPaletteId);
  }, [resolved, characters, onLocationChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const initialMap = activeMapRef.current;
    if (!canvas || !initialMap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = VIEW_WIDTH * dpr;
    canvas.height = VIEW_HEIGHT * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const spawn = (spawnKey && initialMap.spawns?.[spawnKey]) || initialMap.spawn;
    let player: Player = createPlayer(initialMap, spawn);
    let walkClock = 0;

    const loop = startGameLoop((dt) => {
      const activeMap = activeMapRef.current;
      if (!activeMap) return;
      const blocked =
        useUIStore.getState().activeOverlay !== 'none' || useEventStore.getState().current !== null;
      const move = blocked ? { x: 0, y: 0 } : input.getMoveVector();
      const before = player;
      player = movePlayer(player, move, dt, activeMap, solidsRef.current);
      const moving = player.x !== before.x || player.y !== before.y;
      walkClock = moving ? walkClock + dt : 0;

      const completed = useGameStore.getState().completedInteractions;
      const near = blocked ? null : findNearest(player, activeMap, completed);
      nearestRef.current(near);
      useUIStore.getState().setInteractionTarget(
        near
          ? { id: near.object.id, label: near.interactable.prompt, kind: near.interactable.kind }
          : null,
      );

      const camera = computeCamera(player, activeMap);
      render(ctx, {
        map: activeMap,
        player,
        camera,
        nearestObjectId: near?.object.id ?? null,
        characters,
        playerWalkFrame: moving ? Math.floor(walkClock / 0.2) % 2 : 0,
      });

      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __player?: Player; __activeMap?: ResolvedGameMap }).__player = player;
        (window as unknown as { __player?: Player; __activeMap?: ResolvedGameMap }).__activeMap = activeMap;
      }
    });

    return () => {
      loop.stop();
      nearestRef.current(null);
      useUIStore.getState().setInteractionTarget(null);
    };
  }, [map?.id, spawnKey, input, characters]);

  if (!resolved) return <div className="boot">맵 데이터를 불러오는 중입니다.</div>;

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
      aria-label={`${resolved.resolvedName} 탐색 화면`}
    />
  );
}
