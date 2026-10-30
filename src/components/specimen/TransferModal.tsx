'use client';

import { useEffect, useState, useTransition } from 'react';
import { Alert, Button, CopyButton, Group, Modal, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconCopy, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { track } from '@vercel/analytics';
import {
  createTransferCodes,
  cancelTransferCode,
  getTransferCodeStatus,
  type IssuedCode,
  type TransferCodeStatus,
} from '@/app/actions/transfers';
import styles from './transfer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** One coral from its page, or every unclaimed frag of a mother colony. */
  corals: Array<{ id: string; label: string }>;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function TransferModal({ opened, onClose, corals }: Props) {
  const [issued, setIssued] = useState<IssuedCode[] | null>(null);
  const [status, setStatus] = useState<TransferCodeStatus>(null);
  const [pending, startTransition] = useTransition();
  const single = corals.length === 1 ? corals[0] : null;

  const singleId = single?.id;
  useEffect(() => {
    if (!opened || !singleId) return;
    getTransferCodeStatus(singleId).then(setStatus).catch(() => setStatus(null));
  }, [opened, singleId]);

  function close() {
    setIssued(null);
    onClose();
  }

  function generate() {
    startTransition(async () => {
      const res = await createTransferCodes(corals.map((c) => c.id));
      if ('error' in res) {
        notifications.show({ message: res.error, color: 'red' });
        return;
      }
      track('transfer_code_created', { count: res.length });
      setIssued(res);
    });
  }

  function cancel() {
    if (!single) return;
    startTransition(async () => {
      const res = await cancelTransferCode(single.id);
      if (res.error) notifications.show({ message: res.error, color: 'red' });
      else setStatus(null);
    });
  }

  const labelFor = (id: string) => corals.find((c) => c.id === id)?.label ?? id;
  const allText = issued?.map((i) => `${labelFor(i.coralId)}: ${i.code}`).join('\n') ?? '';

  return (
    <Modal opened={opened} onClose={close} title={single ? 'Transfer this coral' : `Transfer codes for ${corals.length} frags`} size="md">
      {issued ? (
        <Stack gap="md">
          <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={16} />}>
            Copy {issued.length === 1 ? 'this code' : 'these codes'} now — {issued.length === 1 ? 'it' : 'they'} can’t be shown again.
            Paste into the order email; the buyer enters it at /claim.
          </Alert>
          <Stack gap={6}>
            {issued.map((i) => (
              <Group key={i.coralId} justify="space-between" wrap="nowrap" className={styles.codeRow}>
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed" truncate>{labelFor(i.coralId)}</Text>
                  <Text className={styles.code}>{i.code}</Text>
                </Stack>
                <CopyButton value={i.code}>
                  {({ copied, copy }) => (
                    <Button size="xs" variant="light" onClick={copy} leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            ))}
          </Stack>
          <Text size="xs" c="dimmed">Expires {fmtDate(issued[0].expiresAt)}. Single use.</Text>
          <Group justify="flex-end">
            {issued.length > 1 && (
              <CopyButton value={allText}>
                {({ copied, copy }) => (
                  <Button variant="default" onClick={copy}>{copied ? 'Copied all' : 'Copy all'}</Button>
                )}
              </CopyButton>
            )}
            <Button onClick={close}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="sm">
            A transfer code moves {single ? 'this coral' : 'each frag'} into the buyer’s collection with its full history.
            Each code works once and expires in 30 days.
          </Text>
          {status && (
            <Alert color={status.expired ? 'gray' : 'ocean'} variant="light">
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm">
                  {status.expired
                    ? `A code from ${fmtDate(status.createdAt)} expired unused.`
                    : `An open code from ${fmtDate(status.createdAt)} expires ${fmtDate(status.expiresAt)}.`}
                  {' '}A new code replaces it.
                </Text>
                {!status.expired && (
                  <Button size="xs" variant="subtle" color="red" onClick={cancel} disabled={pending}>Cancel it</Button>
                )}
              </Group>
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Close</Button>
            <Button onClick={generate} loading={pending}>
              {single ? 'Create transfer code' : `Create ${corals.length} codes`}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
