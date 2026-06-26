'use client';

import { useState } from 'react';
import {
  TextInput,
  Button,
  Text,
  Title,
  Stack,
  Group,
  SegmentedControl,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { createSpecimen } from '@/app/actions/specimens';
import styles from './onboarding.module.css';

const CATEGORIES = [
  { label: 'SPS', value: 'SPS' },
  { label: 'LPS', value: 'LPS' },
  { label: 'Zoa', value: 'ZOA' },
  { label: 'Softie', value: 'SOFTIE' },
];

export function FirstCoralForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SPS');
  const [species, setSpecies] = useState('');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Give your coral a name.'); return; }
    setLoading(true);
    setError('');
    try {
      await createSpecimen({ name: name.trim(), category, species: species.trim() || undefined, origin: origin.trim() || undefined });
      router.push('/collection');
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Title order={1} style={{ fontSize: 26 }}>Add your first coral</Title>
        <Text c="dimmed" size="sm" mt={4}>
          You can add photos and details after — just name it to get started.
        </Text>
      </div>

      <form className={styles.formWrap} onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="e.g. Pink Lemonade Acropora"
            autoFocus
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={error}
            required
          />

          <div>
            <Text size="sm" fw={500} mb={6}>Category</Text>
            <SegmentedControl
              fullWidth
              data={CATEGORIES}
              value={category}
              onChange={setCategory}
            />
          </div>

          <TextInput
            label={<><Text span>Species</Text> <Text span c="dimmed" fw={400}>(optional)</Text></>}
            placeholder="e.g. Acropora millepora"
            value={species}
            onChange={(e) => setSpecies(e.currentTarget.value)}
          />

          <TextInput
            label={<><Text span>Origin</Text> <Text span c="dimmed" fw={400}>(optional)</Text></>}
            placeholder="e.g. Indo, aquacultured, local frag swap"
            value={origin}
            onChange={(e) => setOrigin(e.currentTarget.value)}
          />
        </Stack>

        <Group mt="lg" grow>
          <Button variant="default" onClick={() => router.push('/collection')} disabled={loading}>
            Skip for now
          </Button>
          <Button type="submit" loading={loading}>
            Add coral →
          </Button>
        </Group>
      </form>
    </>
  );
}
