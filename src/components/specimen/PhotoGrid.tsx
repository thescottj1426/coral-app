'use client';

import { useState } from 'react';
import { SimpleGrid, Box, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Image from 'next/image';
import { PhotoLightbox } from './PhotoLightbox';

interface Photo {
  id: string;
  url: string;
  status: string;
}

interface Props {
  photos: Photo[];
  specimenName: string;
  isOwner: boolean;
}

export function PhotoGrid({ photos, specimenName, isOwner }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);

  function openAt(index: number) {
    setActiveIndex(index);
    open();
  }

  return (
    <>
      <SimpleGrid cols={3} spacing="xs">
        {photos.map((photo, i) => (
          <Box
            key={photo.id}
            onClick={() => openAt(i)}
            style={{ aspectRatio: '1', position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
          >
            <Image src={photo.url} alt={specimenName} fill style={{ objectFit: 'cover' }} />
            {isOwner && photo.status === 'pending' && (
              <Box style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Badge color="yellow" variant="filled" size="xs" radius="sm">Pending Review</Badge>
              </Box>
            )}
          </Box>
        ))}
      </SimpleGrid>

      <PhotoLightbox
        photos={photos}
        initialIndex={activeIndex}
        currentIndex={activeIndex}
        onNavigate={setActiveIndex}
        opened={opened}
        onClose={close}
        specimenName={specimenName}
        isOwner={isOwner}
      />
    </>
  );
}
