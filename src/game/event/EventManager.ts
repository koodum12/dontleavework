'use client';

import { create } from 'zustand';
import type { GameEvent } from '@/data/types';
import { gameStateSnapshot, useGameStore } from '@/game/state/gameStore';
import { executeChoice, executeEvent } from './EventExecutor';
import { parseEventFile, validateReferences } from './EventParser';
import { evaluate, firstUnmet, unmetReason } from './ConditionManager';

interface EventManagerState {
  /** id → 이벤트. 여러 챕터 파일을 평탄화해 한 Map 으로 들고 있는다 */
  events: Map<string, GameEvent>;
  loaded: boolean;
  warnings: string[];

  /** 현재 표시 중인 이벤트 (null 이면 플레이어 조작 상태) */
  current: GameEvent | null;
  /** current 다음으로 갈 이벤트 id (선택지 이벤트면 null) */
  pendingNext: string | null;

  loadFromRaw: (files: { source: string; raw: unknown }[]) => void;
  start: (eventId: string) => boolean;
  advance: (fromEventId: string) => void;
  choose: (fromEventId: string, index: number) => void;
  stop: () => void;
}

export const useEventStore = create<EventManagerState>((set, get) => ({
  events: new Map(),
  loaded: false,
  warnings: [],
  current: null,
  pendingNext: null,

  loadFromRaw: (files) => {
    const events = new Map<string, GameEvent>();
    const warnings: string[] = [];
    for (const { source, raw } of files) {
      const parsed = parseEventFile(raw, source);
      warnings.push(...parsed.warnings);
      for (const [id, event] of parsed.events) {
        if (events.has(id)) {
          warnings.push(`${source} ${id}: 다른 파일과 중복된 id — 무시합니다.`);
          continue;
        }
        events.set(id, event);
      }
    }
    warnings.push(...validateReferences(events));
    warnings.forEach((w) => console.warn(`[EventManager] ${w}`));
    set({ events, warnings, loaded: true });
  },

  start: (eventId) => {
    if (get().current) return false; // 이미 이벤트 진행 중
    return enter(eventId, set, get);
  },

  advance: (fromEventId) => {
    const { current, pendingNext } = get();
    // 같은 이벤트에서 올라온 입력만 받는다 (중복 클릭/키 입력 잠금)
    if (!current || current.id !== fromEventId) return;
    if (current.type === 'choice') return; // 선택지는 choose 로만 진행

    if (!pendingNext) {
      get().stop();
      return;
    }
    enter(pendingNext, set, get);
  },

  choose: (fromEventId, index) => {
    const { current } = get();
    if (!current || current.id !== fromEventId) return;
    if (current.type !== 'choice') return;

    // 조건을 만족하지 못한 선택지는 고를 수 없다
    const choice = current.choices?.[index];
    if (choice && !evaluate(choice.conditions, gameStateSnapshot())) return;

    const next = executeChoice(current, index, useGameStore.getState(), useGameStore.getState().mentalConfig);
    if (!next) {
      get().stop();
      return;
    }
    enter(next, set, get);
  },

  stop: () => {
    useGameStore.getState().setCurrentEvent(null);
    set({ current: null, pendingNext: null });
  },
}));

type SetState = (partial: Partial<EventManagerState>) => void;
type GetState = () => EventManagerState;

/** 이벤트에 진입 — effects 를 적용하고 화면에 올린다 */
function enter(eventId: string, set: SetState, get: GetState, depth = 0): boolean {
  if (depth > 50) {
    console.warn('[EventManager] 분기가 너무 깊습니다. 순환 참조를 의심하세요.');
    get().stop();
    return false;
  }

  const event = get().events.get(eventId);
  if (!event) {
    // 존재하지 않는 id 를 가리켜도 앱은 죽지 않는다. 경고 후 체인 종료.
    console.warn(`[EventManager] 존재하지 않는 이벤트 id: "${eventId}"`);
    get().stop();
    return false;
  }

  const game = useGameStore.getState();
  const next = executeEvent(event, game, game.mentalConfig);
  game.setCurrentEvent(event.id);

  // branch / condition 이벤트는 화면에 뜨지 않는다. 조건을 판정해 곧바로 다음으로 넘어간다.
  if (event.type === 'branch' || event.type === 'condition') {
    const state = gameStateSnapshot();
    const matched = (event.branches ?? []).find((b) => evaluate(b.conditions, state));
    const target = matched?.next ?? event.fallback ?? event.next;
    if (!target) {
      console.warn(`[EventManager] ${event.id}: 만족하는 분기도 fallback 도 없습니다.`);
      get().stop();
      return false;
    }
    return enter(target, set, get, depth + 1);
  }

  set({ current: event, pendingNext: next });
  return true;
}

/** 화면에 그릴 선택지 — 조건 미충족은 숨기거나 사유와 함께 비활성 */
export interface RenderableChoice {
  index: number;
  text: string;
  disabled: boolean;
  reason?: string;
}

export function renderableChoices(event: GameEvent | null): RenderableChoice[] {
  if (!event?.choices) return [];
  const state = gameStateSnapshot();
  const result: RenderableChoice[] = [];
  event.choices.forEach((choice, index) => {
    const unmet = firstUnmet(choice.conditions, state);
    if (unmet && choice.hideIfLocked) return;
    result.push({
      index,
      text: choice.text,
      disabled: Boolean(unmet),
      reason: unmet ? choice.lockedText ?? unmetReason(unmet) : undefined,
    });
  });
  return result;
}

/** 이벤트가 진행 중이면 플레이어 조작을 막는다 */
export const isEventActive = () => useEventStore.getState().current !== null;
