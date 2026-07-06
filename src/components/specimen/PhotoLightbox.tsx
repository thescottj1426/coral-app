'use client';

import { useEffect } from 'react';
import { Modal, ActionIcon, Badge, Text, Group } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface Photo {
  id: string;
  url: string;
  status: string;
}

interface Props {
  photos: Photo[];
  initialIndex: number;
  opened: boolean;
  onClose: () => void;
  specimenName: string;
  isOwner: boolean;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ photos, opened, onClose, specimenName, isOwner, currentIndex, onNavigate }: Props) {
  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  useEffect(() => {
    if (!opened) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened, currentIndex, photos.length, onNavigate]);

  if (!photo) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8} align="center">
          <Text fw={600} size="sm">{specimenName}</Text>
          <Text size="xs" c="dimmed">{currentIndex + 1} / {photos.length}</Text>
        </Group>
      }
      size="xl"
      centered
      overlayProps={{ backgroundOpacity: 0.85 }}
      styles={{ body: { padding: 0, position: 'relative' } }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, background: '#000' }}>
        {/* Prev */}
        {hasPrev && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            radius="xl"
            onClick={() => onNavigate(currentIndex - 1)}
            style={{ position: 'absolute', left: 12, zIndex: 2, background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            <IconChevronLeft size={22} />
          </ActionIcon>
        )}

        {/* Image */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={specimenName}
            style={{ display: 'block', maxHeight: '80vh', objectFit: 'contain', width: '100%' }}
          />
          {isOwner && photo.status === 'pending' && (
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <Badge color="yellow" variant="filled" size="sm" radius="sm">Pending Review</Badge>
            </div>
          )}
        </div>

        {/* Next */}
        {hasNext && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            radius="xl"
            onClick={() => onNavigate(currentIndex + 1)}
            style={{ position: 'absolute', right: 12, zIndex: 2, background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            <IconChevronRight size={22} />
          </ActionIcon>
        )}
      </div>
    </Modal>
  );
}
