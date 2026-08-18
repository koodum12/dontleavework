'use client';

import SpeakerName from './SpeakerName';
import ChoiceList, { type ChoiceItem } from './ChoiceList';

interface Props {
  speaker?: string;
  text: string;
  choices?: ChoiceItem[];
  onSelect?: (index: number) => void;
  onNext?: () => void;
}

export default function DialogBox({ speaker, text, choices = [], onSelect, onNext }: Props) {
  return (
    <div className="ui-dialog">
      <SpeakerName name={speaker} />
      <p className="ui-dialog-text">{text}</p>
      {choices.length > 0 ? (
        <ChoiceList choices={choices} onSelect={(i) => onSelect?.(i)} />
      ) : (
        <button type="button" className="ui-button" onClick={onNext}>
          다음
        </button>
      )}
    </div>
  );
}
