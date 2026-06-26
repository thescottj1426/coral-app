'use client';

import { useState } from 'react';
import { Paper, Text, TextInput, Button, Group } from '@mantine/core';
import { IconQrcode } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export function ClaimWidget() {
  const [code, setCode] = useState('');
  const router = useRouter();

  function handleClaim() {
    if (!code.trim()) return;
    router.push(`/claim?code=${encodeURIComponent(code.trim().toUpperCase())}`);
  }

  return (
    <Paper
      withBorder
      p="md"
      style={{
        background: 'var(--mantine-color-ocean-0)',
        borderColor: 'var(--mantine-color-ocean-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Group gap={8} align="center">
        <IconQrcode size={16} color="var(--mantine-color-ocean-7)" stroke={1.7} />
        <Text fw={600} size="sm" c="ocean.9">
          Claim a frag
        </Text>
      </Group>

      <Text size="xs" c="ocean.7">
        Got a frag with an RF code? Claim it to inherit its full lineage.
      </Text>

      <Group gap={8} align="flex-start">
        <TextInput
          placeholder="RF-____"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleClaim()}
          style={{ flex: 1 }}
          styles={{
            input: {
              fontFamily: 'var(--font-ibm-plex-mono), monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'white',
            },
          }}
          maxLength={7}
        />
        <Button onClick={handleClaim} disabled={!code.trim()}>
          Claim
        </Button>
      </Group>
    </Paper>
  );
}
