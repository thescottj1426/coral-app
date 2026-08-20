'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box } from '@mantine/core';
import { coralIdentityGradient } from '@/theme/theme';

interface CoralCardPhotoProps {
  coverPhotoUrl?: string | null;
  rfCode: string;
  /** Photo area shape. Scales with card width so the crop stays consistent across breakpoints. */
  aspectRatio?: string;
  /** Fixed pixel height. Overrides aspectRatio when set. */
  height?: number;
  priority?: boolean;
}

export function CoralCardPhoto({
  coverPhotoUrl,
  rfCode,
  aspectRatio = '4 / 3',
  height,
  priority = false,
}: CoralCardPhotoProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = coverPhotoUrl && !imgError;
  const sizing = height != null ? { height } : { aspectRatio };

  return (
    <Box style={{ ...sizing, position: 'relative', overflow: 'hidden' }}>
      {showImage ? (
        <Image
          src={coverPhotoUrl}
          alt=""
          fill
          sizes="(max-width: 600px) 50vw, 25vw"
          style={{ objectFit: 'cover' }}
          priority={priority}
          onError={() => setImgError(true)}
        />
      ) : (
        <Box style={{ width: '100%', height: '100%', background: coralIdentityGradient(rfCode) }} />
      )}
    </Box>
  );
}
