'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';

/** Fires one analytics event when a server-rendered section is seen. */
export function TrackView({ event }: { event: string }) {
  useEffect(() => {
    track(event);
  }, [event]);
  return null;
}
