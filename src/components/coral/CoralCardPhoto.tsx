'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box } from '@mantine/core';
import { coralIdentityGradient } from '@/theme/theme';

interface CoralCardPhotoProps {
  coverPhotoUrl?: string | null;
  rfCode: string;
  height?: number;
  priority?: boolean;
}

export function CoralCardPhoto({ coverPhotoUrl, rfCode, height = 80, priority = false }: CoralCardPhotoProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = coverPhotoUrl && !imgError;

  return (
    <Box style={{ height, position: 'relative', overflow: 'hidden' }}>
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
        <Box style={{ height, background: coralIdentityGradient(rfCode) }} />
      )}
    </Box>
  );
}
