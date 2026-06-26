'use client';

import { useState } from 'react';
import { Paper, Text, TextInput, Button, Group, Alert } from '@mantine/core';
import { IconLink, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { claimParent } from '@/app/actions/lineage';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

export function ClaimParentForm({ specimenId }: { specimenId: string }) {
  const [rfCode, setRfCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rfCode.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await claimParent(specimenId, rfCode.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setRfCode('');
    }
  }

  return (
    <Paper withBorder p="lg">
      <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>link a parent</Text>
      <Text size="sm" c="dimmed" mb="md">
        Know where this specimen came from? Enter the parent&apos;s RF code to link the lineage.
      </Text>
      <form onSubmit={handleSubmit}>
        <Group gap="sm" align="flex-end">
          <TextInput
            style={{ flex: 1 }}
            placeholder="RF-XXXX"
            value={rfCode}
            onChange={(e) => setRfCode(e.currentTarget.value.toUpperCase())}
            styles={{ input: { fontFamily: 'var(--font-ibm-plex-mono), monospace', letterSpacing: '0.05em' } }}
          />
          <Button
            type="submit"
            leftSection={<IconLink size={14} />}
            loading={loading}
            disabled={!rfCode.trim()}
          >
            Link parent
          </Button>
        </Group>
      </form>
      {error && (
        <Alert mt="sm" color="red" icon={<IconAlertCircle size={14} />}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert mt="sm" color="teal" icon={<IconCheck size={14} />}>
          Parent linked — the chain will update momentarily.
        </Alert>
      )}
    </Paper>
  );
}
