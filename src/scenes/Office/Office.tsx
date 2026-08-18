'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameMap, LocationFile } from '@/data/types';
import { loadLocations } from '@/data/loader/JsonLoader';
import { createPlayer, movePlayer, nearestInteractable, solidRects, type Player } from '@/game/player/PlayerController';
import type { InputController } from '@/game/player/InputController';
import { computeCamera } from '@/game/render/Camera';
import { render } from '@/game/render/Renderer';
import { startGameLoop } from '@/game/render/GameLoop';
import { VIEW_HEIGHT, VIEW_WIDTH } from '@/game/interaction/constants';
import { useUIStore } from '@/game/state/uiStore';

/** 사무실 씬 — 맵 데이터를 읽어 2D 탑다운으로 그린다 */
export default function Office({ input }: { input: InputController }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<GameMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLocations<LocationFile>()
      .then((file) => {
        if (!cancelled) setMap(file.office);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    // devicePixelRatio 적용 — 논리 해상도는 VIEW_WIDTH × VIEW_HEIGHT 로 고정
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = VIEW_WIDTH * dpr;
    canvas.height = VIEW_HEIGHT * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    let player: Player = createPlayer(map);
    const solids = solidRects(map);

    const loop = startGameLoop((dt) => {
      const blocked = useUIStore.getState().activeOverlay !== 'none';
      const move = blocked ? { x: 0, y: 0 } : input.getMoveVector();
      player = movePlayer(player, move, dt, map, solids);

      const near = blocked ? null : nearestInteractable(player, map);
      useUIStore.getState().setInteractionTarget(near ? { id: near.id, label: near.label } : null);

      const camera = computeCamera(player, map);
      render(ctx, { map, player, camera, nearestObjectId: near?.id ?? null });

      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __player?: Player }).__player = player;
      }
    });

    return () => {
      loop.stop();
      useUIStore.getState().setInteractionTarget(null);
    };
  }, [map, input]);

  if (error) return <div className="boot">맵 데이터를 불러오지 못했습니다: {error}</div>;

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
    />
  );
}
