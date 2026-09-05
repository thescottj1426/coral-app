'use client';

import { Stack } from '@mantine/core';
import { FragRow, type LoggedFrag } from './FragRow';

/**
 * A permanent home for the frag camera button.
 *
 * FragRow previously rendered only inside FragModal, so a plug could be
 * photographed during the cutting session and never again — and an unclaimed
 * frag has no owner, so it never appears in /collection either. Every frag
 * photographed after closing that modal was unreachable.
 *
 * Unclaimed only: a claimed frag belongs to its new keeper, and
 * addSpecimenPhoto rejects the parent's owner writing to it.
 */
export function UnclaimedFragList({ frags }: { frags: LoggedFrag[] }) {
  if (frags.length === 0) return null;

  return (
    <Stack gap={6}>
      {frags.map((frag, i) => (
        <FragRow key={frag.id} frag={frag} index={i} />
      ))}
    </Stack>
  );
}
