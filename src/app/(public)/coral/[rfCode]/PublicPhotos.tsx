'use client';

import { useState } from 'react';
import { Box, Text } from '@mantine/core';
import { PhotoLightbox } from '@/components/specimen/PhotoLightbox';

type Photo = { id: string; url: string; status: string };

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

/**
 * Public photo strip. The hero counts as photo 0, so clicking any thumbnail
 * opens the lightbox at the right index across the whole set — not just the
 * ones rendered in the strip.
 */
export function PublicPhotos({
  photos,
  specimenName,
  mode,
}: {
  photos: Photo[];
  specimenName: string;
  /** 'overlay' sits on the hero and only opens the lightbox.
   *  'strip' renders the thumbnail row. Each mounts its own lightbox. */
  mode: 'overlay' | 'strip';
}) {
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return null;

  function open(i: number) {
    setIndex(i);
    setOpened(true);
  }

  const rest = photos.slice(1);

  return (
    <>
      {mode === 'strip' && rest.length > 0 && (
        <>
          <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>
            photos · {photos.length}
          </Text>
          <Box style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {rest.map((photo, i) => (
              <Box
                key={photo.id}
                onClick={() => open(i + 1)}
                style={{
                  width: 110, height: 110, flexShrink: 0,
                  borderRadius: 8, overflow: 'hidden', cursor: 'zoom-in',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`${specimenName} photo ${i + 2}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      {mode === 'overlay' && (
        <button
          type="button"
          onClick={() => open(0)}
          aria-label={`View ${specimenName} photos full size`}
          style={{
            position: 'absolute', inset: 0, cursor: 'zoom-in',
            background: 'transparent', border: 0, padding: 0,
          }}
        />
      )}

      <PhotoLightbox
        photos={photos}
        initialIndex={index}
        currentIndex={index}
        onNavigate={setIndex}
        opened={opened}
        onClose={() => setOpened(false)}
        specimenName={specimenName}
        isOwner={false}
      />
    </>
  );
}
