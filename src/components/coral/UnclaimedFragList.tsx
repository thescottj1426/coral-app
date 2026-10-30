'use client';

import { Button, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowsExchange } from '@tabler/icons-react';
import { FragRow, type LoggedFrag } from './FragRow';
import { TransferModal } from '@/components/specimen/TransferModal';

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
  const [opened, { open, close }] = useDisclosure(false);
  if (frags.length === 0) return null;

  return (
    <Stack gap={6}>
      {frags.map((frag, i) => (
        <FragRow key={frag.id} frag={frag} index={i} />
      ))}
      <Button
        variant="light"
        size="xs"
        leftSection={<IconArrowsExchange size={12} />}
        onClick={open}
        style={{ alignSelf: 'flex-start' }}
      >
        Transfer codes for {frags.length === 1 ? 'this frag' : `all ${frags.length} frags`}
      </Button>
      <TransferModal
        opened={opened}
        onClose={close}
        corals={frags.map((f) => ({ id: f.id, label: f.rfCode }))}
      />
    </Stack>
  );
}
