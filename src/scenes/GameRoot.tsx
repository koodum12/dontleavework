'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Office from './Office/Office';
import EventLayer from './EventLayer';
import { useGameData } from './useGameData';
import { InputController, type TriggerAction } from '@/game/player/InputController';
import { useUIStore } from '@/game/state/uiStore';
import { useGameStore } from '@/game/state/gameStore';
import { gameStateSnapshot } from '@/game/state/gameStore';
import { useEventStore } from '@/game/event/EventManager';
import { evaluate } from '@/game/event/ConditionManager';
import { triggerInteraction } from '@/game/interaction/InteractionObject';
import { consumeItem } from '@/game/interaction/consumeItem';
import type { NearestResult } from '@/game/interaction/InteractionManager';
import type { Evidence, Note, PhoneMessage, PhonePhoto, VoiceMemoData } from '@/data/types';
import MentalState from '@/components/game/MentalState';
import InteractionPrompt from '@/components/game/InteractionPrompt';
import GameMenu from '@/components/game/GameMenu';
import DebugState from '@/components/game/DebugState';
import Phone from '@/components/phone/Phone';
import Inventory from '@/components/inventory/Inventory';
import Button from '@/components/common/Button';

export default function GameRoot() {
  const data = useGameData();

  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const interactionTarget = useUIStore((s) => s.interactionTarget);
  const closeOverlay = useUIStore((s) => s.closeOverlay);

  const mental = useGameStore((s) => s.mental);
  const inventoryIds = useGameStore((s) => s.inventory);
  const evidenceIds = useGameStore((s) => s.evidence);
  const noteIds = useGameStore((s) => s.notes);
  const messageIds = useGameStore((s) => s.messages);
  const photoIds = useGameStore((s) => s.photos);
  const flags = useGameStore((s) => s.flags);
  const characterClues = useGameStore((s) => s.characterClues);
  const unread = useGameStore((s) => s.unreadMessages);
  const eventActive = useEventStore((s) => s.current !== null);

  const [showDebug, setShowDebug] = useState(true);
  const [log, setLog] = useState<string | null>(null);
  const logTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearestRef = useRef<NearestResult | null>(null);

  const flash = useCallback((message: string) => {
    setLog(message);
    if (logTimer.current) clearTimeout(logTimer.current);
    logTimer.current = setTimeout(() => setLog(null), 2200);
  }, []);

  // 데이터가 준비되면 프롤로그부터 시작한다
  useEffect(() => {
    if (!data.ready) return;
    if (!useGameStore.getState().flags.prologue_done) {
      useEventStore.getState().start('prologue_start');
    }
  }, [data.ready]);

  // 휴대폰을 여는 것 자체가 이벤트 트리거가 될 수 있다 (day3 §5 onPhoneOpen)
  useEffect(() => {
    if (activeOverlay !== 'phone' || !data.ready) return;
    const state = gameStateSnapshot();
    const hit = (data.phone.onOpen ?? []).find((entry) => evaluate(entry.conditions, state));
    if (!hit) return;
    useUIStore.getState().closeOverlay();
    useEventStore.getState().start(hit.eventId);
  }, [activeOverlay, data]);

  const input = useMemo(
    () =>
      new InputController({
        onTrigger: (action: TriggerAction) => {
          const ui = useUIStore.getState();
          const events = useEventStore.getState();

          // 이벤트 진행 중에는 대화 진행 입력만 받는다
          if (events.current) {
            if (action === 'advance' || action === 'interact') events.advance(events.current.id);
            else if (action === 'menu') ui.toggleOverlay('menu');
            return;
          }

          switch (action) {
            case 'phone':
              ui.toggleOverlay('phone');
              break;
            case 'inventory':
              ui.toggleOverlay('inventory');
              break;
            case 'menu':
              if (ui.activeOverlay !== 'none') ui.closeOverlay();
              else ui.toggleOverlay('menu');
              break;
            case 'interact': {
              if (ui.activeOverlay !== 'none') break;
              const reason = triggerInteraction(nearestRef.current);
              if (reason === 'no-event' && nearestRef.current) {
                flash(`${nearestRef.current.interactable.prompt}: 아직 볼 것이 없다.`);
              }
              break;
            }
            case 'advance':
              break;
          }
        },
      }),
    [flash],
  );

  // 개발 중 상태 확인용 훅 (프로덕션 빌드에서는 붙지 않는다)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __gameStore?: typeof useGameStore }).__gameStore = useGameStore;
    }
  }, []);

  useEffect(() => {
    input.attach();
    return () => {
      input.detach();
      if (logTimer.current) clearTimeout(logTimer.current);
    };
  }, [input]);

  /* ---- id → 데이터 ---- */
  const items = inventoryIds.map(
    (id) => data.items[id] ?? { id, name: id, description: '(데이터 없음)' },
  );
  const evidence: Evidence[] = evidenceIds.map(
    (e) => data.evidence[e.id] ?? { id: e.id, category: e.category, name: e.id },
  );
  const notes: Note[] = noteIds
    .map((id) => data.notes[id])
    .filter((n): n is Note => Boolean(n));
  const allMessages = messageIds
    .map((id) => data.phone.messages[id])
    .filter((m): m is PhoneMessage => Boolean(m));
  const messages = allMessages.filter((m) => !m.recoveredBy);
  const deletedMessages = Object.values(data.phone.messages).filter((m) => m.recoveredBy);
  const deletedMemos = Object.values(data.phone.memos).filter((m) => m.recoveredBy);
  const memos: VoiceMemoData[] = Object.values(data.phone.memos).filter(
    (m) => !m.recoveredBy || flags[m.recoveredBy],
  );
  const photos: PhonePhoto[] = photoIds
    .map((id) => data.phone.photos[id])
    .filter((p): p is PhonePhoto => Boolean(p));
  const characterNames = Object.fromEntries(
    Object.entries(data.characters).map(([id, c]) => [id, c.name]),
  );

  return (
    <div className="game-root">
      <div className="game-stage">
        <Office
          input={input}
          onNearestChange={(target) => {
            nearestRef.current = target;
          }}
        />

        {/* ---- HUD (디자인은 Day 4) ---- */}
        <div className="hud">
          <div className="hud-top-left">
            <MentalState mental={mental} max={data.mental?.max ?? 100} bands={data.mental?.bands ?? []} />
            <div className="hud-help">
              WASD 이동 · E 조사 · Space 진행 · Tab 휴대폰{unread > 0 ? ` (${unread})` : ''} · I 인벤토리 · ESC 메뉴
            </div>
          </div>

          <div className="hud-top-right">
            <Button onClick={() => setShowDebug((v) => !v)}>
              상태 패널 {showDebug ? '끄기' : '켜기'}
            </Button>
          </div>

          <div className="hud-bottom">
            {!eventActive && <InteractionPrompt prompt={interactionTarget?.label ?? null} />}
            {log && <div className="hud-log">{log}</div>}
            <EventLayer />
          </div>

          {showDebug && (
            <div className="hud-demo">
              <DebugState />
            </div>
          )}

          {/* ---- 오버레이 (동시에 하나만) ---- */}
          <Phone
            open={activeOverlay === 'phone'}
            onClose={closeOverlay}
            messages={messages}
            deletedMessages={deletedMessages}
            notes={notes}
            photos={photos}
            memos={memos}
            deletedMemos={deletedMemos}
            flags={flags}
            unread={unread}
            onReadMessages={() => useGameStore.getState().markMessagesRead()}
          />
          <Inventory
            open={activeOverlay === 'inventory'}
            onClose={closeOverlay}
            items={items}
            evidence={evidence}
            characterClues={characterClues}
            characterNames={characterNames}
            onUse={(id) => {
              const result = consumeItem(id, data.items);
              if (result === 'ok') {
                closeOverlay();
                flash(`${data.items[id]?.name ?? id}을(를) 사용했다.`);
              } else {
                flash('지금은 사용할 수 없다.');
              }
            }}
          />
          <GameMenu open={activeOverlay === 'menu'} onClose={closeOverlay} />
        </div>
      </div>
    </div>
  );
}
