'use client';

import Image from 'next/image';
import SpeakerName from './SpeakerName';
import ChoiceList, { type ChoiceItem } from './ChoiceList';

interface Props {
  speaker?: string;
  speakerColor?: string;
  portrait?: string;
  text: string;
  choices?: ChoiceItem[];
  onSelect?: (index: number) => void;
  onNext?: () => void;
}

export default function DialogBox({
  speaker, speakerColor, portrait, text, choices = [], onSelect, onNext,
}: Props) {
  return (
    <div className="ui-dialog">
      {portrait && (
        <div className="ui-dialog-character" aria-hidden="true">
          <Image
            className="ui-dialog-portrait"
            src={portrait}
            alt=""
            width={1024}
            height={1536}
            unoptimized
          />
        </div>
      )}
      <div className="ui-dialog-content">
        <SpeakerName name={speaker} color={speakerColor} />
        <p className="ui-dialog-text">{text}</p>
        {choices.length > 0 ? (
          <ChoiceList choices={choices} onSelect={(i) => onSelect?.(i)} />
        ) : (
          <button type="button" className="ui-button" onClick={onNext}>
            다음
          </button>
        )}
      </div>
    </div>
  );
}
