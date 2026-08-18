'use client';

import type { MentalBand } from '@/data/types';
import { mentalLabel } from '@/game/state/mental';

interface Props {
  mental: number;
  max?: number;
  bands?: MentalBand[];
}

export default function MentalState({ mental, max = 100, bands = [] }: Props) {
  return (
    <div className="ui-mental" data-testid="mental-state">
      정신력 <span data-testid="mental-value">{mental}</span>/{max} —{' '}
      <span data-testid="mental-label">{mentalLabel(mental, bands)}</span>
    </div>
  );
}
