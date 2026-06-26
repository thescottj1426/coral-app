'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box,
  Group,
  Stack,
  Text,
  Button,
  Paper,
  SimpleGrid,
  TextInput,
  Anchor,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { reviewPhoto } from '@/app/actions/admin';
import type { PendingPhoto } from '@/app/actions/admin';
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
          {photo.coralRfCode && (
            <Text style={EYEBROW}>{photo.coralRfCode}</Text>
          )}
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
            className={styles.rejectInput}
            autoFocus
          />
        )}

        <Group gap="xs" mt={2}>
          <Button
            size="xs"
            variant="light"
            color="teal"
            leftSection={<IconCheck size={12} />}
            onClick={approve}
            style={{ flex: 1 }}
          >
            Approve
          </Button>
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconX size={12} />}
            onClick={reject}
            style={{ flex: 1 }}
          >
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

export function PhotoQueueClient({ photos: initial }: { photos: PendingPhoto[] }) {
  const [photos, setPhotos] = useState(initial);

  function remove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  if (photos.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
        <Text fw={600} mb={4}>All clear</Text>
        <Text size="sm" c="dimmed">No photos pending review.</Text>
      </Paper>
    );
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onDone={remove} />
      ))}
    </SimpleGrid>
  );
}
