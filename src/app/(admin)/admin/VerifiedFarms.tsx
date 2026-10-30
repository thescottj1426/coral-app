'use client';

import { useState, useTransition } from 'react';
import { Button, CloseButton, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconRosetteDiscountCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { setUserVerified } from '@/app/actions/admin';

export function VerifiedFarms({ initial }: { initial: string[] }) {
  const [verified, setVerified] = useState(initial);
  const [username, setUsername] = useState('');
  const [pending, startTransition] = useTransition();

  function set(name: string, on: boolean) {
    startTransition(async () => {
      const res = await setUserVerified(name, on);
      if (res.error) {
        notifications.show({ message: res.error, color: 'red' });
        return;
      }
      const clean = name.trim().replace(/^@/, '');
      setVerified((prev) => (on ? [...new Set([...prev, clean])].sort() : prev.filter((u) => u.toLowerCase() !== clean.toLowerCase())));
      if (on) setUsername('');
    });
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group gap={8}>
          <IconRosetteDiscountCheck size={18} color="var(--mantine-color-teal-6)" />
          <Text fw={600}>Verified farms</Text>
        </Group>
        <Text size="xs" c="dimmed">
          Corals descended from a verified user’s colonies show “Verified farm”. Everyone else shows “Origin self-reported”.
        </Text>
        <Group gap="xs" wrap="wrap">
          {verified.length === 0 && <Text size="sm" c="dimmed">None yet.</Text>}
          {verified.map((u) => (
            <Group key={u} gap={2} wrap="nowrap" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 999, padding: '2px 4px 2px 10px' }}>
              <Text size="sm" fw={600}>@{u}</Text>
              <CloseButton size="xs" aria-label={`Unverify @${u}`} disabled={pending} onClick={() => set(u, false)} />
            </Group>
          ))}
        </Group>
        <Group gap="xs">
          <TextInput
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && username.trim() && set(username, true)}
            style={{ flex: 1, maxWidth: 260 }}
          />
          <Button variant="light" color="teal" disabled={!username.trim()} loading={pending} onClick={() => set(username, true)}>
            Verify
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
