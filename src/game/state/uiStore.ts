'use client';

import { create } from 'zustand';

export type Overlay = 'none' | 'phone' | 'inventory' | 'menu';

export interface InteractionTarget { id: string; label: string }

interface UIState {
  /** 동시에 두 개가 열리지 않도록 오버레이는 하나만 관리한다 */
  activeOverlay: Overlay;
  /** 상호작용 거리 안의 대상 (없으면 null) */
  interactionTarget: InteractionTarget | null;

  toggleOverlay: (overlay: Exclude<Overlay, 'none'>) => void;
  closeOverlay: () => void;
  setInteractionTarget: (target: InteractionTarget | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeOverlay: 'none',
  interactionTarget: null,

  toggleOverlay: (overlay) =>
    set((s) => ({ activeOverlay: s.activeOverlay === overlay ? 'none' : overlay })),
  closeOverlay: () => set({ activeOverlay: 'none' }),
  // 매 프레임 호출되므로 같은 대상이면 상태를 바꾸지 않는다 (불필요한 리렌더 방지)
  setInteractionTarget: (target) =>
    set((s) => (s.interactionTarget?.id === target?.id ? s : { interactionTarget: target })),
}));

/** UI가 열려 있으면 이동 입력을 차단한다 (day1 §4 inputMode) */
export const inputModeOf = (overlay: Overlay): 'game' | 'ui' =>
  overlay === 'none' ? 'game' : 'ui';

export const isMovementBlocked = () =>
  inputModeOf(useUIStore.getState().activeOverlay) === 'ui';
