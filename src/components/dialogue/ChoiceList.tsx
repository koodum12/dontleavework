'use client';

import Button from '../common/Button';

export interface ChoiceItem {
  text: string;
  disabled?: boolean;
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
        </li>
      ))}
    </ul>
  );
}
