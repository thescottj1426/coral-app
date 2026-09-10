'use client';

import { useRef, useState } from 'react';
import { Button, Loader } from '@mantine/core';
import { IconCamera, IconScissors, IconPhotoPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useViewer } from '@/lib/useViewer';
import { FragModal } from '@/components/coral/FragModal';
import type { CoralStage } from '@/app/actions/specimens';
import styles from './coral.module.css';

/**
 * Owner-only affordances on a page that is statically cached.
 *
 * The page cannot know the session without becoming dynamic and losing the
 * cache that exists for crawlers, so ownership is resolved here, on the client,
 * by comparing the viewer's username to the coral's. Until the viewer is known
 * these render nothing at all — a control that appears and then vanishes is
 * worse than one that arrives a beat late.
 */
export function useIsOwner(ownerUsername: string | null): boolean | null {
  const viewer = useViewer();
  if (viewer === null) return null; // not known yet
  if (!viewer.username || !ownerUsername) return false;
  return viewer.username === ownerUsername;
}

export function PhotoDropzone({
  coralId,
  ownerUsername,
  label,
  compact = false,
  fallback = null,
}: {
  coralId: string;
  ownerUsername: string | null;
  label: string;
  compact?: boolean;
  /** Shown to everyone who cannot upload, so a photoless coral is not a blank box. */
  fallback?: React.ReactNode;
}) {
  const isOwner = useIsOwner(ownerUsername);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  if (!isOwner) return <>{fallback}</>;

  async function upload(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      notifications.show({ title: 'File too large', message: 'Max 8 MB', color: 'red' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('specimenId', coralId);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error ?? 'Upload failed');
      }
      notifications.show({ message: 'Photo added — it appears once approved', color: 'teal' });
      router.refresh();
    } catch (err) {
      notifications.show({
        title: 'Could not add the photo',
        message: err instanceof Error ? err.message : 'Please try again.',
        color: 'red',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div
      className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
      style={compact ? { minHeight: 92 } : undefined}
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {uploading ? <Loader size="sm" color="gray" /> : compact ? <IconPhotoPlus size={18} /> : <IconCamera size={22} />}
      <span style={{ textAlign: 'center', padding: '0 12px' }}>
        {uploading ? 'Uploading…' : label}
      </span>
    </div>
  );
}

export function CutFragButton({
  coralId,
  rfCode,
  name,
  stage,
  ownerUsername,
}: {
  coralId: string;
  rfCode: string;
  name: string;
  stage: CoralStage | null;
  ownerUsername: string | null;
}) {
  const isOwner = useIsOwner(ownerUsername);
  const [opened, setOpened] = useState(false);

  if (!isOwner) return null;

  return (
    <>
      <Button
        color="red"
        size="sm"
        leftSection={<IconScissors size={15} />}
        onClick={() => setOpened(true)}
      >
        Cut a frag
      </Button>
      <FragModal
        opened={opened}
        onClose={() => setOpened(false)}
        parentId={coralId}
        parentRfCode={rfCode}
        parentName={name}
        parentStage={stage}
        parentGeneration={0}
      />
    </>
  );
}

/** Shown to a signed-out visitor only — a signed-in one already has an account. */
export function JoinStrip() {
  const viewer = useViewer();
  if (viewer === null || viewer.username) return null;

  return (
    <div className={styles.joinStrip}>
      <span>Track your own collection and trace every lineage on Coral Chest</span>
      <Button component="a" href="/sign-up" size="xs" color="ocean">
        Join free
      </Button>
    </div>
  );
}
