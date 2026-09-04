'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box, Group, Stack, Text, Button, Paper,
  SimpleGrid, TextInput, Anchor, Tabs, Badge,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { reviewPhoto } from '@/app/actions/admin';
import type { PendingPhoto, ReviewedPhoto } from '@/app/actions/admin';
import styles from '../admin.module.css';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function PhotoCard({ photo, onDone }: { photo: PendingPhoto; onDone: (id: string) => void }) {
  const [, startTransition] = useTransition();
  const [rejectMode, setRejectMode] = useState(false);
  const [note, setNote] = useState('');
  const [fading, setFading] = useState(false);

  function fade(id: string) {
    setFading(true);
    setTimeout(() => onDone(id), 260);
  }

  function approve() {
    startTransition(async () => {
      await reviewPhoto(photo.id, 'approved');
      notifications.show({ message: `Approved photo for ${photo.coralName}`, color: 'teal' });
      fade(photo.id);
    });
  }

  function reject() {
    if (!rejectMode) { setRejectMode(true); return; }
    startTransition(async () => {
      await reviewPhoto(photo.id, 'rejected', note || undefined);
      notifications.show({ message: `Rejected photo for ${photo.coralName}`, color: 'red' });
      fade(photo.id);
    });
  }

  return (
    <Paper withBorder radius="md" className={`${styles.photoCard} ${fading ? styles.fadingOut : ''}`}>
      <Box style={{ position: 'relative', aspectRatio: '1' }}>
        <Image src={photo.url} alt={photo.coralName} fill style={{ objectFit: 'cover' }} sizes="25vw" />
      </Box>
      <Stack gap={6} p="sm">
        <Text size="sm" fw={700} truncate>{photo.coralName}</Text>
        <Group gap={4}>
          <Anchor component={Link} href={`/users/${photo.ownerUsername}`} size="xs" c="dimmed">
            @{photo.ownerUsername}
          </Anchor>
          {photo.coralRfCode && <Text style={EYEBROW}>{photo.coralRfCode}</Text>}
        </Group>
        <Text size="xs" c="dimmed">
          {new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        {rejectMode && (
          <TextInput
            size="xs"
            placeholder="Reason (optional)"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            autoFocus
          />
        )}
        <Group gap="xs" mt={2}>
          <Button size="xs" variant="light" color="teal" leftSection={<IconCheck size={12} />} onClick={approve} style={{ flex: 1 }}>
            Approve
          </Button>
          <Button size="xs" variant="light" color="red" leftSection={<IconX size={12} />} onClick={reject} style={{ flex: 1 }}>
            {rejectMode ? 'Confirm' : 'Reject'}
          </Button>
        </Group>
        {rejectMode && (
          <Button size="xs" variant="subtle" color="gray" onClick={() => { setRejectMode(false); setNote(''); }}>
            Cancel
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function HistoryRow({ photo }: { photo: ReviewedPhoto }) {
  const approved = photo.status === 'approved';
  return (
    <Paper withBorder p="sm" radius="md">
      <Group gap="sm" wrap="nowrap">
        <Box style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
          <Image src={photo.url} alt={photo.coralName} fill style={{ objectFit: 'cover' }} sizes="64px" />
        </Box>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={8} wrap="nowrap">
            <Text size="sm" fw={700} truncate>{photo.coralName}</Text>
            <Badge size="xs" color={approved ? 'teal' : 'red'} variant="light">
              {approved ? 'Approved' : 'Rejected'}
            </Badge>
          </Group>
          <Group gap={6}>
            <Anchor component={Link} href={`/users/${photo.ownerUsername}`} size="xs" c="dimmed">
              @{photo.ownerUsername}
            </Anchor>
            {photo.coralRfCode && <Text style={EYEBROW}>{photo.coralRfCode}</Text>}
          </Group>
          {photo.reviewNote && (
            <Text size="xs" c="dimmed" fs="italic">&quot;{photo.reviewNote}&quot;</Text>
          )}
        </Stack>
        <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
          <Text size="xs" c="dimmed">
            {photo.reviewedAt
              ? new Date(photo.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </Text>
          {photo.reviewerUsername && (
            <Text size="xs" c="dimmed">by @{photo.reviewerUsername}</Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

interface Props {
  pending: PendingPhoto[];
  history: ReviewedPhoto[];
}

export function PhotosPageClient({ pending: initial, history }: Props) {
  const [pending, setPending] = useState(initial);

  function remove(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <Tabs defaultValue="queue">
      <Tabs.List mb="md">
        <Tabs.Tab value="queue">
          Queue {pending.length > 0 && <Badge size="xs" color="yellow" variant="filled" ml={6}>{pending.length}</Badge>}
        </Tabs.Tab>
        <Tabs.Tab value="history">History</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="queue">
        {pending.length === 0 ? (
          <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
            <Text fw={600} mb={4}>All clear</Text>
            <Text size="sm" c="dimmed">No photos pending review.</Text>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {pending.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onDone={remove} />
            ))}
          </SimpleGrid>
        )}
      </Tabs.Panel>

      <Tabs.Panel value="history">
        {history.length === 0 ? (
          <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
            <Text size="sm" c="dimmed">No reviewed photos yet.</Text>
          </Paper>
        ) : (
          <Stack gap="xs">
            {history.map((photo) => (
              <HistoryRow key={photo.id} photo={photo} />
            ))}
          </Stack>
        )}
      </Tabs.Panel>
    </Tabs>
  );
}
