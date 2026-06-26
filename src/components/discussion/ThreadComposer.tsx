'use client';

import { useState, useTransition } from 'react';
import { Modal, TextInput, SegmentedControl, Button, Group, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconGitBranch, IconHexagon, IconMapPin, IconTag, IconTrendingUp, IconPhoto, IconPin,
} from '@tabler/icons-react';
import { createThread } from '@/app/actions/discussions';
import { AnchorCard } from './AnchorCard';
import { THREAD_TYPES } from './TypeBadge';
import { anchorInk } from '@/lib/anchorTypes';
import type { ThreadType } from '@/app/actions/discussions';

const ALT_ANCHORS = [
  { key: 'line',    label: 'Bloodline',      hue: 210, Icon: IconGitBranch  },
  { key: 'species', label: 'Species',        hue: 140, Icon: IconHexagon    },
  { key: 'photo',   label: 'Photo pin',      hue: 330, Icon: IconMapPin     },
  { key: 'listing', label: 'Listing',        hue: 40,  Icon: IconTag        },
  { key: 'log',     label: 'Care log',       hue: 190, Icon: IconTrendingUp },
] as const;

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontWeight: 500,
  color: 'var(--mantine-color-dimmed)',
};

interface Props {
  specimenId: string;
  specimenRfCode: string | null;
  specimenName: string;
  specimenIdentityHue?: number | null;
  opened: boolean;
  onClose: () => void;
}

export function ThreadComposer({
  specimenId, specimenRfCode, specimenName, specimenIdentityHue, opened, onClose,
}: Props) {
  const [title, setTitle]   = useState('');
  const [body,  setBody]    = useState('');
  const [type,  setType]    = useState<ThreadType>('question');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClose() {
    setTitle(''); setBody('');
    onClose();
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        const thread = await createThread({
          anchorType: 'specimen',
          anchorId: specimenId,
          specimenRfCode: specimenRfCode ?? specimenId,
          title: title.trim(),
          body: body.trim() || null,
          type,
        });
        notifications.show({ message: 'Thread started', color: 'teal' });
        handleClose();
        router.push(`/collection/${specimenRfCode ?? specimenId}/discussion/${thread.id}`);
      } catch {
        notifications.show({ message: 'Could not post thread', color: 'red' });
      }
    });
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="md">New thread</Text>}
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">

          {/* Anchor — pre-filled to specimen */}
          <div>
            <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>
              Anchor — what is this about?
            </Text>
            <AnchorCard
              anchorType="specimen"
              name={specimenName}
              code={specimenRfCode}
              identityHue={specimenIdentityHue}
            />
            {/* Anchor-type switcher chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>Anchor instead to:</Text>
              {ALT_ANCHORS.map(({ key, label, hue, Icon }) => (
                <span
                  key={key}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    height: 24, padding: '0 8px',
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    background: 'var(--mantine-color-body)',
                    fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
                    color: 'var(--mantine-color-gray-7)',
                  }}
                >
                  <Icon size={11} color={anchorInk(hue)} stroke={1.8} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Thread type */}
          <div>
            <Text size="sm" fw={500} mb={6}>Thread type</Text>
            <SegmentedControl
              fullWidth
              size="xs"
              data={THREAD_TYPES.map(t => ({ value: t.value, label: t.label }))}
              value={type}
              onChange={v => setType(v as ThreadType)}
            />
          </div>

          {/* Title */}
          <TextInput
            label="Title"
            placeholder="What's your question or topic?"
            value={title}
            onChange={e => setTitle(e.currentTarget.value)}
            autoFocus
            required
          />

          {/* Body / details */}
          <div>
            <Text size="sm" fw={500} mb={6}>Details</Text>
            <Textarea
              placeholder="Describe what you're seeing. Add photos so people can help…"
              value={body}
              onChange={e => setBody(e.currentTarget.value)}
              autosize
              minRows={3}
            />
            <Group gap={8} mt={8}>
              <button type="button" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 28, padding: '0 10px',
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
                background: 'var(--mantine-color-body)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <IconPhoto size={13} /> Add photo
              </button>
              <button type="button" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 28, padding: '0 10px',
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
                background: 'var(--mantine-color-body)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <IconPin size={13} /> Pin on photo
              </button>
            </Group>
          </div>

          {/* Post to / Visibility row */}
          <Group gap={12}>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} mb={4}>Post to</Text>
              <div style={{
                height: 36, border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 12px',
                fontSize: 13, color: 'var(--mantine-color-gray-7)',
              }}>
                Public feed
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} mb={4}>Visibility</Text>
              <div style={{
                height: 36, border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 12px',
                fontSize: 13, color: 'var(--mantine-color-gray-7)',
              }}>
                Public
              </div>
            </div>
          </Group>

          {/* Actions */}
          <Group justify="space-between" align="center" pt={4}>
            <Group gap={8} align="center">
              <div style={{
                width: 32, height: 18, borderRadius: 999,
                background: 'var(--mantine-primary-color-filled)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', right: 2, top: 2,
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                }} />
              </div>
              <Text size="xs" c="dimmed">Watch this thread</Text>
            </Group>
            <Group gap="sm">
              <Button variant="default" onClick={handleClose} disabled={isPending}>Cancel</Button>
              <Button type="submit" loading={isPending} disabled={!title.trim()}>Post thread</Button>
            </Group>
          </Group>

        </Stack>
      </form>
    </Modal>
  );
}
