'use client';

import { Button, Title, Text, Stack } from '@mantine/core';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <Stack gap="md" align="center">
            <Title order={2} style={{ fontFamily: 'var(--font-sora)' }}>Something went wrong</Title>
            <Text c="dimmed" size="sm">
              An unexpected error occurred. We&apos;ve been notified and are looking into it.
            </Text>
            <Button onClick={reset} variant="default" size="sm">Try again</Button>
          </Stack>
        </div>
      </body>
    </html>
  );
}
