'use client';

import { Group, Text, Button, Paper } from '@mantine/core';
import { useSession } from '@/lib/auth-client';

export function CtaBanner() {
  const { data: session } = useSession();
  if (session?.user) return null;

  return (
    <Paper withBorder p="sm" mb="md" style={{ background: 'var(--mantine-color-ocean-0)' }}>
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" c="ocean.8" fw={500}>
          Track your own collection and trace every lineage on Coral Chest.
        </Text>
        <Button component="a" href="/sign-up" size="xs" variant="filled">Join free</Button>
      </Group>
    </Paper>
  );
}
