'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Office from './Office/Office';
import { InputController, type TriggerAction } from '@/game/player/InputController';
import { useUIStore } from '@/game/state/uiStore';
import MentalState from '@/components/game/MentalState';
import InteractionPrompt from '@/components/game/InteractionPrompt';
import GameMenu from '@/components/game/GameMenu';
import Phone from '@/components/phone/Phone';
import Inventory from '@/components/inventory/Inventory';
import Panel from '@/components/common/Panel';
import Button from '@/components/common/Button';
import DialogBox from '@/components/dialogue/DialogBox';
import EvidenceList from '@/components/evidence/EvidenceList';
import EvidenceDetail from '@/components/evidence/EvidenceDetail';
import {
  DUMMY_EVIDENCE,
  DUMMY_ITEMS,
  DUMMY_MEMOS,
  DUMMY_MESSAGES,
  DUMMY_NOTES,
  DUMMY_PHOTOS,
} from './dummyUi';

export default function GameRoot() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const interactionTarget = useUIStore((s) => s.interactionTarget);
  const closeOverlay = useUIStore((s) => s.closeOverlay);

  const [log, setLog] = useState<string | null>(null);
  const [showUiDemo, setShowUiDemo] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const logTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (message: string) => {
    setLog(message);
    if (logTimer.current) clearTimeout(logTimer.current);
    logTimer.current = setTimeout(() => setLog(null), 2000);
  };

  const input = useMemo(
    () =>
      new InputController({
        onTrigger: (action: TriggerAction) => {
          const ui = useUIStore.getState();
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
              if (ui.activeOverlay !== 'none' || !ui.interactionTarget) break;
              // Day 1은 프롬프트 확인까지. 실제 이벤트 실행은 Day 2.
              flash(`${ui.interactionTarget.label}을(를) 조사했다. (이벤트 연결은 Day 2)`);
              break;
            }
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

  return (
    <div className="game-root">
      <div className="game-stage">
        <Office input={input} />

        {/* ---- HUD (디자인은 Day 4) ---- */}
        <div className="hud">
          <div className="hud-top-left">
            <MentalState mental={100} />
            <div className="hud-help">WASD 이동 · E 조사 · Tab 휴대폰 · I 인벤토리 · ESC 메뉴</div>
          </div>

          <div className="hud-top-right">
            <Button onClick={() => setShowUiDemo((v) => !v)}>
              UI 데모 {showUiDemo ? '끄기' : '켜기'}
            </Button>
          </div>

          <div className="hud-bottom">
            <InteractionPrompt prompt={interactionTarget?.label ?? null} />
            {log && <div className="hud-log">{log}</div>}
          </div>

          {showUiDemo && (
            <div className="hud-demo">
              <Panel title="DialogBox">
                <DialogBox
                  speaker="(더미) 화자"
                  text="(더미) 대사 — 스토리는 Day 2부터 JSON 으로 들어온다."
                  choices={[{ text: '(더미) 선택지 1' }, { text: '(더미) 선택지 2' }, { text: '(더미) 잠긴 선택지', disabled: true }]}
                  onSelect={(i) => flash(`선택지 ${i + 1} 선택 (Day 2에서 연결)`)}
                />
              </Panel>
              <Panel title="Evidence">
                <EvidenceList
                  evidence={DUMMY_EVIDENCE}
                  selectedId={selectedEvidence}
                  onSelect={setSelectedEvidence}
                />
                <EvidenceDetail
                  evidence={DUMMY_EVIDENCE.find((e) => e.id === selectedEvidence) ?? null}
                />
              </Panel>
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
            items={DUMMY_ITEMS}
            onUse={(id) => flash(`${id} 사용 (Day 3에서 연결)`)}
          />
          <GameMenu open={activeOverlay === 'menu'} onClose={closeOverlay} />
        </div>
      </div>
    </div>
  );
}
