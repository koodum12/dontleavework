'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameMap } from '@/data/types';
import { loadLocations } from '@/data/loader/JsonLoader';
import { createPlayer, movePlayer, solidRects, type Player } from '@/game/player/PlayerController';
import type { InputController } from '@/game/player/InputController';
import { findNearest, type NearestResult } from '@/game/interaction/InteractionManager';
import { computeCamera } from '@/game/render/Camera';
import { render } from '@/game/render/Renderer';
import { startGameLoop } from '@/game/render/GameLoop';
import { VIEW_HEIGHT, VIEW_WIDTH } from '@/game/interaction/constants';
import { useUIStore } from '@/game/state/uiStore';
import { useGameStore } from '@/game/state/gameStore';
import { useEventStore } from '@/game/event/EventManager';

/** 사무실 씬 — 맵 데이터를 읽어 2D 탑다운으로 그린다 */
export default function Office({
  input,
  onNearestChange,
}: {
  input: InputController;
  onNearestChange: (target: NearestResult | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<GameMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nearestRef = useRef(onNearestChange);
  nearestRef.current = onNearestChange;

  useEffect(() => {
    let cancelled = false;
    loadLocations()
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
      // 오버레이가 열려 있거나 이벤트가 진행 중이면 조작을 막는다
      const blocked =
        useUIStore.getState().activeOverlay !== 'none' || useEventStore.getState().current !== null;
      const move = blocked ? { x: 0, y: 0 } : input.getMoveVector();
      player = movePlayer(player, move, dt, map, solids);

      const completed = useGameStore.getState().completedInteractions;
      const near = blocked ? null : findNearest(player, map, completed);
      nearestRef.current(near);
      useUIStore
        .getState()
        .setInteractionTarget(near ? { id: near.object.id, label: near.interactable.prompt } : null);

      const camera = computeCamera(player, map);
      render(ctx, { map, player, camera, nearestObjectId: near?.object.id ?? null });

      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __player?: Player }).__player = player;
      }
    });

    return () => {
      loop.stop();
      nearestRef.current(null);
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
