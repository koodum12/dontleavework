'use client';

/** delta time 상한 — 탭 복귀 시 한 프레임에 순간이동하는 것을 막는다 */
const MAX_DELTA = 0.05; // 초

export interface GameLoop {
  stop: () => void;
}

export function startGameLoop(step: (dt: number) => void): GameLoop {
  let raf = 0;
  let last = performance.now();
  let running = true;

  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, MAX_DELTA);
    last = now;
    step(dt);
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  return {
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
