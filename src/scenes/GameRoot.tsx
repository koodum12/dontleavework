'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Office from './Office/Office';
import EventLayer from './EventLayer';
import Home from './Home/Home';
import { useGameData } from './useGameData';
import { InputController, type TriggerAction } from '@/game/player/InputController';
import { useUIStore } from '@/game/state/uiStore';
import { gameStateSnapshot, useGameStore } from '@/game/state/gameStore';
import { useMentalBandId } from '@/game/state/useMentalFilter';
import { currentObjective } from '@/game/state/objectives';
import { useEventStore } from '@/game/event/EventManager';
import { evaluate } from '@/game/event/ConditionManager';
import { collectionStats, endingChecklists, findEnding } from '@/game/ending/EndingManager';
import { triggerInteraction } from '@/game/interaction/InteractionObject';
import { consumeItem } from '@/game/interaction/consumeItem';
import type { NearestResult } from '@/game/interaction/InteractionManager';
import type { Evidence, Note, PhoneMessage, PhonePhoto, VoiceMemoData } from '@/data/types';
import { deleteSave, hasSave, load, recordEnding, save, unlockedEndings } from '@/services/SaveService';
import MentalState from '@/components/game/MentalState';
import InteractionPrompt from '@/components/game/InteractionPrompt';
import WorldMap from '@/components/game/WorldMap';
import GameMenu from '@/components/game/GameMenu';
import DebugState from '@/components/game/DebugState';
import EndingScreen from '@/components/game/EndingScreen';
import Phone from '@/components/phone/Phone';
import Inventory from '@/components/inventory/Inventory';
import Button from '@/components/common/Button';

type Phase = 'home' | 'playing';

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
  const chapter = useGameStore((s) => s.currentChapter);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const pendingSpawn = useGameStore((s) => s.pendingSpawn);
  const ending = useGameStore((s) => s.ending);
  const bandId = useMentalBandId();
  const currentEvent = useEventStore((s) => s.current);

  const [phase, setPhase] = useState<Phase>('home');
  const [saveExists, setSaveExists] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [fading, setFading] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('2층 사무실');
  const logTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearestRef = useRef<NearestResult | null>(null);

  const flash = useCallback((message: string) => {
    setLog(message);
    if (logTimer.current) clearTimeout(logTimer.current);
    logTimer.current = setTimeout(() => setLog(null), 2200);
  }, []);

  const autoSave = useCallback(async () => {
    try {
      await save();
      setSaveExists(true);
    } catch (e) {
      console.warn('[GameRoot] 자동 저장 실패:', e);
    }
  }, []);

  useEffect(() => {
    hasSave().then(setSaveExists);
    unlockedEndings().then(setUnlocked);
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __gameStore?: typeof useGameStore }).__gameStore = useGameStore;
    }
  }, []);

  /* ---- 챕터 전환: 페이드 + 자동 저장 ---- */
  useEffect(() => {
    if (phase !== 'playing' || !chapter) return;
    setFading(true);
    const timer = setTimeout(() => setFading(false), 600);
    void autoSave();
    return () => clearTimeout(timer);
  }, [chapter, currentLocation, phase, autoSave]);

  /* ---- 이벤트 체인이 끝날 때 자동 저장 ---- */
  const prevEventRef = useRef<string | null>(null);
  useEffect(() => {
    const id = currentEvent?.id ?? null;
    if (prevEventRef.current && !id && phase === 'playing') void autoSave();
    prevEventRef.current = id;
  }, [currentEvent, phase, autoSave]);

  /* ---- 엔딩 도달 ---- */
  useEffect(() => {
    if (!ending) return;
    void autoSave();
    // 회차 기록은 새 게임을 해도 남는다
    void recordEnding(ending).then(() => unlockedEndings().then(setUnlocked));
  }, [ending, autoSave]);

  /* ---- 휴대폰을 여는 것 자체가 이벤트 트리거 (day3 §5) ---- */
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
            case 'map':
              ui.toggleOverlay('map');
              break;
            case 'menu':
              if (ui.activeOverlay !== 'none') ui.closeOverlay();
              else ui.toggleOverlay('menu');
              break;
            case 'interact': {
              if (ui.activeOverlay !== 'none') break;
              const result = triggerInteraction(nearestRef.current);
              if (result.reason === 'locked') flash(result.message ?? '아직 갈 수 없다.');
              if (result.reason === 'no-event' && nearestRef.current) {
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

  useEffect(() => {
    if (phase !== 'playing') return;
    input.attach();
    return () => {
      input.detach();
      if (logTimer.current) clearTimeout(logTimer.current);
    };
  }, [input, phase]);

  const startNewGame = useCallback(() => {
    if (!data.ready) {
      flash('게임 데이터를 불러오는 중이다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    useGameStore.getState().resetGame();
    useEventStore.getState().stop();
    useUIStore.getState().closeOverlay();
    setPhase('playing');
    useEventStore.getState().start('prologue_start');
  }, [data.ready, flash]);

  const continueGame = useCallback(async () => {
    if (!data.ready) {
      flash('게임 데이터를 불러오는 중이다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const ok = await load();
    if (!ok) {
      flash('불러올 저장 데이터가 없다.');
      return;
    }
    useEventStore.getState().stop();
    setPhase('playing');
  }, [data.ready, flash]);

  /* ---- id → 데이터 ---- */
  const items = inventoryIds.map((id) => data.items[id] ?? { id, name: id, description: '(데이터 없음)' });
  const evidence: Evidence[] = evidenceIds.map(
    (e) => data.evidence[e.id] ?? { id: e.id, category: e.category, name: e.id },
  );
  const notes: Note[] = noteIds.map((id) => data.notes[id]).filter((n): n is Note => Boolean(n));
  const allMessages = messageIds
    .map((id) => data.phone.messages[id])
    .filter((m): m is PhoneMessage => Boolean(m));
  const messages = allMessages.filter((m) => !m.recoveredBy || flags[m.recoveredBy]);
  const deletedMessages = Object.values(data.phone.messages).filter((m) => m.recoveredBy);
  const deletedMemos = Object.values(data.phone.memos).filter((m) => m.recoveredBy);
  const memos: VoiceMemoData[] = Object.values(data.phone.memos).filter(
    (m) => !m.recoveredBy || flags[m.recoveredBy],
  );
  const photos: PhonePhoto[] = photoIds
    .map((id) => data.phone.photos[id])
    .filter((p): p is PhonePhoto => Boolean(p));
  const characterNames = Object.fromEntries(Object.entries(data.characters).map(([id, c]) => [id, c.name]));
  const endingMeta = ending && data.endings ? findEnding(data.endings, ending) : null;
  const objective = currentObjective(data.objectives, gameStateSnapshot(), data.notes);
  const activeMap = data.locations[currentLocation] ?? data.locations.office;

  if (phase === 'home') {
    return <Home ready={data.ready} onNewGame={startNewGame} onContinue={continueGame} />;
  }

  return (
    <div className="game-root">
      <div className={`game-stage mental-${bandId ?? 'stable'}`}>
        <Office
          input={input}
          map={activeMap}
          spawnKey={pendingSpawn}
          npcs={data.npcs}
          palettes={data.palettes}
          characters={data.characters}
          onLocationChange={setLocationName}
          onNearestChange={(target) => {
            nearestRef.current = target;
          }}
        />

        <div className="hud">
          <div className="hud-top-left">
            <div className="hud-location">{locationName}</div>
            <MentalState mental={mental} max={data.mental?.max ?? 100} bands={data.mental?.bands ?? []} />
            {objective && (
              <div className="hud-objective" data-testid="objective">
                <span>{objective.label}</span> {objective.text}
              </div>
            )}
            <div className="hud-help">
              WASD 이동 · E 조사 · Space 진행 · Tab 휴대폰{unread > 0 ? ` (${unread})` : ''} · I 인벤토리 · ESC 메뉴
            </div>
          </div>

          <div className="hud-top-right">
            <button
              type="button"
              className="ui-icon-button hud-map-button"
              onClick={() => useUIStore.getState().toggleOverlay('map')}
              aria-label="지도 열기"
              title="지도"
            >
              <span aria-hidden="true">⌖</span>
            </button>
            <Button onClick={() => setShowDebug((v) => !v)}>상태 {showDebug ? '숨기기' : '보기'}</Button>
          </div>

          <div className="hud-bottom">
            {!currentEvent && !ending && <InteractionPrompt prompt={interactionTarget?.label ?? null} kind={interactionTarget?.kind} />}
            {log && !ending && <div className="hud-log">{log}</div>}
            {/* 엔딩 화면이 뜨면 대화창은 감춘다 (같은 텍스트가 두 번 보이지 않게) */}
            {!ending && <EventLayer characters={data.characters} />}
          </div>

          {showDebug && (
            <div className="hud-demo">
              <DebugState />
            </div>
          )}

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
          <WorldMap
            open={activeOverlay === 'map'}
            locations={data.locations}
            currentLocation={currentLocation}
            onClose={closeOverlay}
          />
          <GameMenu
            open={activeOverlay === 'menu'}
            onClose={closeOverlay}
            hasSave={saveExists}
            onSave={autoSave}
            onLoad={async () => {
              await load();
              useEventStore.getState().stop();
              closeOverlay();
            }}
            onTitle={() => {
              closeOverlay();
              useEventStore.getState().stop();
              setPhase('home');
            }}
          />

          <EndingScreen
            ending={endingMeta}
            text={currentEvent?.type === 'ending' ? currentEvent.text ?? '' : ''}
            stats={collectionStats(gameStateSnapshot(), Object.keys(data.evidence).length)}
            checklists={data.endings ? endingChecklists(data.endings, gameStateSnapshot(), ending) : []}
            unlocked={unlocked}
            onRestart={async () => {
              await deleteSave();
              startNewGame();
            }}
          />
        </div>

        <div className={`fade-layer ${fading ? 'is-fading' : ''}`} />
      </div>
    </div>
  );
}
