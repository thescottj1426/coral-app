'use client';

import {
  Box,
  Group,
  Stack,
  Text,
  Button,
  SimpleGrid,
  Paper,
  Badge,
  Tabs,
  TextInput,
} from '@mantine/core';
import { IconPlus, IconSearch, IconLeaf } from '@tabler/icons-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { SpecimenThumb } from '@/components/specimen/SpecimenThumb';
import { AddSpecimenDrawer } from '@/components/specimen/AddSpecimenDrawer';
import { createSpecimen, type SpecimenRow } from '@/app/actions/specimens';
import Image from 'next/image';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function SpecimenCard({ specimen }: { specimen: SpecimenRow }) {
  const thumb = specimen.rfCode ?? specimen.id;
  return (
    <Paper
      component={Link}
      href={`/collection/${specimen.rfCode ?? specimen.id}`}
      withBorder
      style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }}
    >
      {specimen.coverPhotoUrl ? (
        <div style={{ width: '100%', height: 80, borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}>
          <Image
            src={specimen.coverPhotoUrl}
            alt={specimen.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </div>
      ) : (
        <SpecimenThumb
          rfCode={thumb}
          size={0}
          style={{ width: '100%', height: 80, borderRadius: '8px 8px 0 0' }}
        />
      )}

      <Stack gap={6} p="sm">
        <Group gap={6} wrap="nowrap" justify="space-between">
          <Text size="sm" fw={700} truncate style={{ flex: 1 }}>
            {specimen.name}
          </Text>
          {specimen.category && <CategoryBadge category={specimen.category} />}
        </Group>

        {specimen.species && (
          <Text size="xs" c="dimmed" truncate style={{ fontStyle: 'italic' }}>
            {specimen.species}
          </Text>
        )}

        <Group gap={0} justify="space-between">
          <Text style={{ ...EYEBROW, fontSize: 9 }}>{specimen.rfCode ?? '—'}</Text>
          <Text style={EYEBROW}>
            {specimen.acquiredDate
              ? new Date(specimen.acquiredDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : new Date(specimen.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

type Category = 'SPS' | 'LPS' | 'SOFTIE' | 'ZOA' | 'ANEMONE' | 'OTHER';

const TAB_CATEGORIES: Array<{ value: string; label: string; category?: Category }> = [
  { value: 'all',     label: 'All' },
  { value: 'sps',     label: 'SPS',     category: 'SPS' },
  { value: 'lps',     label: 'LPS',     category: 'LPS' },
  { value: 'zoa',     label: 'Zoa',     category: 'ZOA' },
  { value: 'other',   label: 'Other' },
];

interface CollectionClientProps {
  specimens: SpecimenRow[];
}

export function CollectionClient({ specimens }: CollectionClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleCreate(values: { name: string; species?: string; category: string; origin?: string; notes?: string; photoUrl?: string; photoKey?: string }) {
    await createSpecimen(values);
    setDrawerOpen(false);
    startTransition(() => router.refresh());
  }

  const filtered = specimens.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.species?.toLowerCase().includes(q) ||
      s.rfCode?.toLowerCase().includes(q)
    );
  });

  function tabSpecimens(tab: string) {
    const cat = TAB_CATEGORIES.find((t) => t.value === tab);
    if (!cat || tab === 'all') return filtered;
    if (tab === 'other') return filtered.filter((s) => !['SPS', 'LPS', 'ZOA'].includes(s.category ?? ''));
    return filtered.filter((s) => s.category === cat.category);
  }

  const GRID = { base: 2, sm: 3, md: 4, lg: 5 } as const;

  return (
    <Box p="lg" maw={1200}>
      <AddSpecimenDrawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
      />

      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text
            component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            My Collection
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {specimens.length} specimen{specimens.length !== 1 ? 's' : ''}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setDrawerOpen(true)}>
          Add specimen
        </Button>
      </Group>

      <Group gap="sm" mb="lg" wrap="nowrap">
        <TextInput
          placeholder="Search specimens…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 280 }}
        />
      </Group>

      <Tabs defaultValue="all" mb="md">
        <Tabs.List>
          {TAB_CATEGORIES.map((t) => {
            const count = t.value === 'all'
              ? filtered.length
              : tabSpecimens(t.value).length;
            return (
              <Tabs.Tab
                key={t.value}
                value={t.value}
                rightSection={<Badge size="xs" variant="light">{count}</Badge>}
              >
                {t.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {TAB_CATEGORIES.map((t) => (
          <Tabs.Panel key={t.value} value={t.value} pt="md">
            {tabSpecimens(t.value).length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                {search ? 'No specimens match your search.' : 'No specimens here yet.'}
              </Text>
            ) : (
              <SimpleGrid cols={GRID} spacing="sm">
                {tabSpecimens(t.value).map((s) => (
                  <SpecimenCard key={s.id} specimen={s} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>
    </Box>
  );
}
