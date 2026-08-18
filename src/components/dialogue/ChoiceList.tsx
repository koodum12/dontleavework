'use client';

import Button from '../common/Button';

export interface ChoiceItem {
  text: string;
  disabled?: boolean;
  /** 선택지 아래 작은 표시 (예: 되돌릴 수 없다) */
  note?: string;
}

interface Props {
  choices: ChoiceItem[];
  onSelect: (index: number) => void;
}

export default function ChoiceList({ choices, onSelect }: Props) {
  if (choices.length === 0) return null;
  return (
    <ul className="ui-choices">
      {choices.map((c, i) => (
        <li key={`${c.text}-${i}`}>
          <Button disabled={c.disabled} onClick={() => onSelect(i)}>
            {c.text}
          </Button>
          {c.note && <small className="choice-note">⟲ {c.note}</small>}
        </li>
      ))}
    </ul>
  );
}
