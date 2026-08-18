'use client';

import Panel from '../common/Panel';
import { useGameStore } from '@/game/state/gameStore';
import { useEventStore } from '@/game/event/EventManager';

/** GameState 변화를 눈으로 확인하는 개발용 패널 (디자인 대상 아님) */
export default function DebugState() {
  const mental = useGameStore((s) => s.mental);
  const inventory = useGameStore((s) => s.inventory);
  const evidence = useGameStore((s) => s.evidence);
  const notes = useGameStore((s) => s.notes);
  const flags = useGameStore((s) => s.flags);
  const completed = useGameStore((s) => s.completedInteractions);
  const currentEvent = useGameStore((s) => s.currentEvent);
  const warnings = useEventStore((s) => s.warnings);

  const flagEntries = Object.entries(flags).filter(([, v]) => v);

  return (
    <Panel title="GameState (디버그)">
      <dl className="ui-debug">
        <dt>정신력</dt><dd data-testid="dbg-mental">{mental}</dd>
        <dt>현재 이벤트</dt><dd data-testid="dbg-event">{currentEvent ?? '-'}</dd>
        <dt>아이템</dt><dd data-testid="dbg-inventory">{inventory.join(', ') || '-'}</dd>
        <dt>증거</dt><dd data-testid="dbg-evidence">{evidence.map((e) => `${e.id}(${e.category})`).join(', ') || '-'}</dd>
        <dt>기록</dt><dd data-testid="dbg-notes">{notes.join(', ') || '-'}</dd>
        <dt>플래그</dt><dd data-testid="dbg-flags">{flagEntries.map(([k]) => k).join(', ') || '-'}</dd>
        <dt>완료 상호작용</dt><dd data-testid="dbg-completed">{completed.join(', ') || '-'}</dd>
        <dt>데이터 경고</dt><dd data-testid="dbg-warnings">{warnings.length}</dd>
      </dl>
    </Panel>
  );
}
