'use client';

import { useState, useRef } from 'react';
import {
  Paper, Group, Text, ActionIcon, CopyButton, TextInput, Loader, Image, Badge,
} from '@mantine/core';
import { IconCopy, IconCheck, IconLink, IconCamera } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { addSpecimenPhoto } from '@/app/actions/specimens';
import { setFragRecipient } from '@/app/actions/lineage';

const MONO = 'var(--font-ibm-plex-mono), monospace';

export type LoggedFrag = { id: string; rfCode: string; kept: boolean; photoUrl?: string | null };

/**
 * One logged frag. Two dispositions, decided per plug:
 *  - kept:      already in your collection, nothing to hand out
 *  - unclaimed: waiting for whoever receives the plug to claim the code
 *
 * Photo and recipient writes are authorised server-side by the frag being
 * unclaimed and the caller owning its parent; the permission lapses on claim.
 */
export function FragRow({ frag, index }: { frag: LoggedFrag; index: number }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(frag.photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const claimUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/claim?code=${frag.rfCode}` : '';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      notifications.show({ title: 'File too large', message: 'Max 8 MB', color: 'red' });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error ?? 'Upload failed');
      }
      const data = await res.json();
      await addSpecimenPhoto({ specimenId: frag.id, photoKey: data.key, photoUrl: data.url });
      setPhotoUrl(data.url);
      notifications.show({
        title: 'Photo added',
        message: `Attached to ${frag.rfCode}. It appears once approved.`,
        color: 'teal',
      });
    } catch (err) {
      notifications.show({
        title: 'Could not add photo',
        message: err instanceof Error ? err.message : 'Please try again.',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  }

  async function saveRecipient() {
    const res = await setFragRecipient(frag.id, recipient);
    if (res.error) {
      notifications.show({ title: 'Not saved', message: res.error, color: 'red' });
    }
  }

  return (
    <Paper
      p="sm"
      style={{
        background: frag.kept ? 'var(--mantine-color-teal-0)' : 'var(--mantine-color-ocean-0)',
        border: `1px solid var(--mantine-color-${frag.kept ? 'teal' : 'ocean'}-2)`,
      }}
    >
      <Group gap={10} wrap="nowrap" align="center">
        <Text style={{ fontFamily: MONO, fontSize: 10, color: 'var(--mantine-color-dimmed)', width: 20, flexShrink: 0, textAlign: 'right' }}>
          {index + 1}
        </Text>

        <div style={{ flexShrink: 0 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`Frag ${frag.rfCode}`}
              w={36} h={36} radius={6} fit="cover"
              style={{ cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}
            />
          ) : (
            <ActionIcon
              variant="light"
              color={frag.kept ? 'teal' : 'ocean'}
              size={36}
              radius={6}
              onClick={() => fileRef.current?.click()}
              loading={uploading}
              aria-label={`Add a photo of frag ${frag.rfCode}`}
              title="Photograph this plug"
            >
              {uploading ? <Loader size={14} /> : <IconCamera size={16} />}
            </ActionIcon>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" align="center">
            <Text style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, letterSpacing: '0.08em', color: `var(--mantine-color-${frag.kept ? 'teal' : 'ocean'}-9)`, lineHeight: 1.2 }}>
              {frag.rfCode}
            </Text>
            <Badge size="xs" variant="light" color={frag.kept ? 'teal' : 'ocean'} radius="sm">
              {frag.kept ? 'Yours' : 'Unclaimed'}
            </Badge>
          </Group>

          {frag.kept ? (
            <Link
              href={`/collection/${frag.rfCode}`}
              style={{ fontSize: 12, color: 'var(--mantine-color-teal-7)', textDecoration: 'none' }}
            >
              In your collection →
            </Link>
          ) : (
            <TextInput
              value={recipient}
              onChange={(e) => setRecipient(e.currentTarget.value)}
              onBlur={saveRecipient}
              placeholder="Who got it?"
              variant="unstyled"
              size="xs"
              styles={{ input: { fontSize: 12, minHeight: 20, height: 20, color: 'var(--mantine-color-ocean-8)' } }}
              aria-label={`Who received frag ${frag.rfCode}`}
            />
          )}
        </div>

        <CopyButton value={frag.rfCode} timeout={2000}>
          {({ copied, copy }) => (
            <ActionIcon variant="light" color={copied ? 'teal' : 'gray'} size="md" radius="md" onClick={copy} aria-label={`Copy ${frag.rfCode}`}>
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          )}
        </CopyButton>

        {/* A kept frag has nothing to hand out, so no claim link. */}
        {!frag.kept && (
          <CopyButton value={claimUrl} timeout={2000}>
            {({ copied, copy }) => (
              <ActionIcon variant="light" color={copied ? 'teal' : 'ocean'} size="md" radius="md" onClick={copy} aria-label="Copy claim link">
                {copied ? <IconCheck size={14} /> : <IconLink size={14} />}
              </ActionIcon>
            )}
          </CopyButton>
        )}
      </Group>
    </Paper>
  );
}
