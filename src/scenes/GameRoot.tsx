'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Office from './Office/Office';
import EventLayer from './EventLayer';
import { InputController, type TriggerAction } from '@/game/player/InputController';
import { useUIStore } from '@/game/state/uiStore';
import { useGameStore } from '@/game/state/gameStore';
import { useEventStore } from '@/game/event/EventManager';
import { triggerInteraction } from '@/game/interaction/InteractionObject';
import type { NearestResult } from '@/game/interaction/InteractionManager';
import { loadEventFiles, loadItems } from '@/data/loader/JsonLoader';
import type { ItemFile } from '@/data/types';
import MentalState from '@/components/game/MentalState';
import InteractionPrompt from '@/components/game/InteractionPrompt';
import GameMenu from '@/components/game/GameMenu';
import DebugState from '@/components/game/DebugState';
import Phone from '@/components/phone/Phone';
import Inventory from '@/components/inventory/Inventory';
import Button from '@/components/common/Button';
import { DUMMY_MEMOS, DUMMY_MESSAGES, DUMMY_NOTES, DUMMY_PHOTOS } from './dummyUi';

export default function GameRoot() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const interactionTarget = useUIStore((s) => s.interactionTarget);
  const closeOverlay = useUIStore((s) => s.closeOverlay);
  const mental = useGameStore((s) => s.mental);
  const inventoryIds = useGameStore((s) => s.inventory);
  const eventActive = useEventStore((s) => s.current !== null);

  const [itemFile, setItemFile] = useState<ItemFile>({});
  const [showDebug, setShowDebug] = useState(true);
  const [log, setLog] = useState<string | null>(null);
  const logTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearestRef = useRef<NearestResult | null>(null);

  const flash = (message: string) => {
    setLog(message);
    if (logTimer.current) clearTimeout(logTimer.current);
    logTimer.current = setTimeout(() => setLog(null), 2000);
  };

  // 스토리 데이터 로드 (클라이언트에서만)
  useEffect(() => {
    loadEventFiles().then((files) => useEventStore.getState().loadFromRaw(files));
    loadItems().then(setItemFile).catch((e: unknown) => console.warn('[GameRoot] items.json', e));
  }, []);

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
    [],
  );

  useEffect(() => {
    input.attach();
    return () => {
      input.detach();
      if (logTimer.current) clearTimeout(logTimer.current);
    };
  }, [input]);

  const items = inventoryIds.map(
    (id) => itemFile[id] ?? { id, name: id, description: '(데이터 없음)' },
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
            <MentalState mental={mental} />
            <div className="hud-help">WASD 이동 · E 조사 · Space 진행 · Tab 휴대폰 · I 인벤토리 · ESC 메뉴</div>
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
            messages={DUMMY_MESSAGES}
            notes={DUMMY_NOTES}
            memos={DUMMY_MEMOS}
            photos={DUMMY_PHOTOS}
          />
          <Inventory
            open={activeOverlay === 'inventory'}
            onClose={closeOverlay}
            items={items}
            onUse={(id) => flash(`${id} 사용 (Day 3에서 연결)`)}
          />
          <GameMenu open={activeOverlay === 'menu'} onClose={closeOverlay} />
        </div>
      </div>
    </div>
  );
}
