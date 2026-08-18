'use client';

import { Button, Container, Title, Text, Stack } from '@mantine/core';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container size="sm" py={80} ta="center">
      <Stack gap="md" align="center">
        <Title order={2} style={{ fontFamily: 'var(--font-sora)' }}>Something went wrong</Title>
        <Text c="dimmed" size="sm">
          An unexpected error occurred. We've been notified and are looking into it.
        </Text>
        <Button onClick={reset} variant="default" size="sm">Try again</Button>
      </Stack>
    </Container>
  );
}
