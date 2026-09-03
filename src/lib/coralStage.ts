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
