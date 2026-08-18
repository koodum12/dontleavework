'use client';

import DialogBox from '@/components/dialogue/DialogBox';
import { useEventStore } from '@/game/event/EventManager';

/** EventManager 의 현재 이벤트를 구독해 대화창을 그린다 */
export default function EventLayer() {
  const current = useEventStore((s) => s.current);
  const advance = useEventStore((s) => s.advance);
  const choose = useEventStore((s) => s.choose);

  if (!current) return null;

  const choices = (current.choices ?? []).map((c) => ({ text: c.text }));

  return (
    <div className="event-layer">
      <DialogBox
        speaker={current.speaker}
        text={current.text ?? ''}
        choices={choices}
        // fromEventId 를 넘겨 같은 이벤트에서 온 입력만 받는다 (중복 클릭 잠금)
        onSelect={(i) => choose(current.id, i)}
        onNext={() => advance(current.id)}
      />
    </div>
  );
}
