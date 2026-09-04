import type { CoralStage } from '@/app/actions/specimens';

const LABELS: Record<CoralStage, string> = {
  MOTHER_COLONY: 'Mother colony',
  COLONY: 'Colony',
  MINI_COLONY: 'Mini colony',
  FRAG: 'Frag',
  MICRO_FRAG: 'Micro frag',
};

export function stageLabel(stage: CoralStage | null | undefined): string | null {
  return stage ? LABELS[stage] ?? stage : null;
}

/**
 * In-app lineage depth only counts links inside Polyp. A coral imported from a
 * farm carries its prior generations in `generationFromMother`, so the true
 * generation is the chain root's offset plus the depth beneath it.
 */
export function effectiveGeneration(
  inAppDepth: number,
  rootGenerationFromMother: number | null | undefined
): number {
  return (rootGenerationFromMother ?? 0) + inAppDepth;
}

import type { CoralStatus } from '@/app/actions/specimens';

const STATUS_LABELS: Record<CoralStatus, string> = {
  ALIVE: 'Alive',
  LOST: 'Lost',
  SOLD: 'Sold',
  GIVEN: 'Given away',
};

/** null for ALIVE — a living coral needs no badge. */
export function statusLabel(status: CoralStatus | null | undefined): string | null {
  if (!status || status === 'ALIVE') return null;
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: CoralStatus | null | undefined): string {
  if (status === 'LOST') return 'gray';
  if (status === 'SOLD') return 'grape';
  if (status === 'GIVEN') return 'teal';
  return 'gray';
}
