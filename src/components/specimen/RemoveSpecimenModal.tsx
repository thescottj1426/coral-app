'use client';

import { useState } from 'react';
import { Modal, Stack, Text, Radio, Textarea, Button, Group, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { deleteSpecimen, type CoralStatus } from '@/app/actions/specimens';

const OPTIONS: Array<{ value: Exclude<CoralStatus, 'ALIVE'>; label: string; hint: string }> = [
  { value: 'LOST',  label: 'It died',    hint: 'RTN, STN, a crash — anything that ended it' },
  { value: 'SOLD',  label: 'I sold it',  hint: 'Went to a buyer' },
  { value: 'GIVEN', label: 'I gave it away', hint: 'Traded or gifted to another keeper' },
];

export function RemoveSpecimenModal({
  opened,
  onClose,
  specimenId,
  specimenName,
}: {
  opened: boolean;
  onClose: () => void;
  specimenId: string;
  specimenName: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Exclude<CoralStatus, 'ALIVE'>>('LOST');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      await deleteSpecimen(specimenId, status, note.trim() || undefined);
      notifications.show({
        title: 'Removed from your collection',
        message: `${specimenName} is no longer active. Its lineage is intact and you can restore it.`,
        color: 'teal',
      });
      onClose();
      router.push('/collection');
      router.refresh();
    } catch {
      notifications.show({
        title: 'Could not remove it',
        message: 'Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={440}
      title={
        <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 16 }}>
          Remove {specimenName}
        </Text>
      }
    >
      <Stack gap="md">
        <Radio.Group value={status} onChange={(v) => setStatus(v as Exclude<CoralStatus, 'ALIVE'>)}>
          <Stack gap="xs">
            {OPTIONS.map((o) => (
              <Radio
                key={o.value}
                value={o.value}
                label={o.label}
                description={o.hint}
              />
            ))}
          </Stack>
        </Radio.Group>

        <Textarea
          label="Note (optional)"
          placeholder="e.g. RTN'd after a heater failure"
          autosize
          minRows={2}
          maxRows={4}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
        />

        {/* The old copy claimed this was permanent. It is not, and saying so
            matters most for the person who clicked it by accident. */}
        <Alert icon={<IconInfoCircle size={16} />} color="ocean" variant="light">
          It stays in the lineage, so any frags you cut from it keep their history.
          You can restore it at any time.
        </Alert>

        <Group gap="sm">
          <Button variant="default" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="ocean" style={{ flex: 2 }} onClick={handleRemove} loading={loading}>
            Remove from collection
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
