'use client';

import DialogBox from '@/components/dialogue/DialogBox';
import CollectionStrip from '@/components/game/CollectionStrip';
import { renderableChoices, useEventStore } from '@/game/event/EventManager';
import { gameStateSnapshot, useGameStore } from '@/game/state/gameStore';
import type { CharacterFile } from '@/data/types';

/** EventManager 의 현재 이벤트를 구독해 대화창을 그린다 */
export default function EventLayer({ characters }: { characters: CharacterFile }) {
  const current = useEventStore((s) => s.current);
  const advance = useEventStore((s) => s.advance);
  const choose = useEventStore((s) => s.choose);
  // 조건부 선택지가 상태 변화에 따라 다시 계산되도록 구독한다
  useGameStore((s) => s.flags);
  useGameStore((s) => s.evidence);

  if (!current) return null;

  const isChoice = current.type === 'choice';
  const choices = renderableChoices(current).map((c) => ({
    text: c.reason ? `${c.text} — ${c.reason}` : c.text,
    disabled: c.disabled,
    index: c.index,
    note: c.irreversible ? '되돌릴 수 없다' : undefined,
  }));
  const speakerCharacter = Object.values(characters)
    .sort((a, b) => b.name.length - a.name.length)
    .find((character) => current.speaker === character.name || current.speaker?.includes(character.name));

  return (
    <div className="event-layer">
      {/* 선택 시점에는 결과가 아니라 지금까지 확보한 것을 보여 준다 */}
      {isChoice && <CollectionStrip state={gameStateSnapshot()} />}
      <DialogBox
        speaker={current.speaker}
        speakerColor={speakerCharacter?.color}
        portrait={speakerCharacter?.portrait
          ? `/assets/images/portraits/${speakerCharacter.portrait}`
          : undefined}
        text={current.text ?? ''}
        choices={choices}
        // fromEventId 를 넘겨 같은 이벤트에서 온 입력만 받는다 (중복 클릭 잠금)
        onSelect={(i) => choose(current.id, choices[i]?.index ?? i)}
        onNext={() => advance(current.id)}
      />
    </div>
  );
}
