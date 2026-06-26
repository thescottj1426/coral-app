'use client';

import {
  Box, Group, Stack, Text, TextInput, Chip, Paper,
  SimpleGrid, Avatar, Anchor, Divider, ScrollArea,
} from '@mantine/core';
import { IconSearch, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import Link from 'next/link';
import { CategoryBadge } from '@/components/coral/CategoryBadge';
import { CoralCardPhoto } from '@/components/coral/CoralCardPhoto';
import { coralIdentityGradient } from '@/theme/theme';
import type { CoralCategory } from '@/theme/theme';
import type { ExploreSpecimen, ExploreCollector } from '@/app/actions/explore';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

const ALL_CATS = [
  { value: 'ALL', label: 'All' },
  { value: 'SPS', label: 'SPS' },
  { value: 'LPS', label: 'LPS' },
  { value: 'ZOA', label: 'Zoa' },
  { value: 'SOFTIE', label: 'Softie' },
  { value: 'ANEMONE', label: 'Anemone' },
];

function SpecimenCard({ s }: { s: ExploreSpecimen }) {
  return (
    <Paper
      component={Link}
      href={`/coral/${s.rfCode ?? s.id}`}
      withBorder
      style={{ textDecoration: 'none', display: 'block', overflow: 'hidden' }}
    >
      <CoralCardPhoto coverPhotoUrl={s.coverPhotoUrl} rfCode={s.rfCode ?? s.id} height={72} />
      <Stack gap={6} p="sm">
        <Group gap={6} justify="space-between" wrap="nowrap">
          <Text size="sm" fw={700} truncate style={{ flex: 1 }}>{s.name}</Text>
          {s.category && s.category !== 'OTHER' && (
            <CategoryBadge category={s.category as CoralCategory} />
          )}
        </Group>
        {s.species && (
          <Text size="xs" c="dimmed" truncate style={{ fontStyle: 'italic' }}>{s.species}</Text>
        )}
        <Group gap={6} wrap="nowrap">
          <Avatar
            size={16}
            radius="xl"
            style={{ background: coralIdentityGradient(s.ownerUsername + '_av'), flexShrink: 0 }}
          >
            {s.ownerUsername[0].toUpperCase()}
          </Avatar>
          <Anchor
            component={Link}
            href={`/u/${s.ownerUsername}`}
            size="xs"
            c="dimmed"
            truncate
            onClick={(e) => e.stopPropagation()}
          >
            @{s.ownerUsername}
          </Anchor>
        </Group>
      </Stack>
    </Paper>
  );
}

function CollectorCard({ c }: { c: ExploreCollector }) {
  return (
    <Paper
      component={Link}
      href={`/u/${c.username}`}
      withBorder
      p="md"
      style={{ minWidth: 160, flexShrink: 0, textDecoration: 'none', display: 'block' }}
    >
      <Stack gap={8} align="center">
        <Avatar size={48} radius="xl" style={{ background: coralIdentityGradient(c.username) }}>
          {(c.displayName ?? c.username)[0].toUpperCase()}
        </Avatar>
        <Stack gap={2} align="center">
          <Text size="sm" fw={700} ta="center" style={{ lineHeight: 1.2 }}>
            {c.displayName ?? `@${c.username}`}
          </Text>
          <Text size="xs" c="dimmed" ta="center">@{c.username}</Text>
        </Stack>
        <Stack gap={0} align="center">
          <Text size="sm" fw={700}>{c.specimenCount}</Text>
          <Text style={EYEBROW}>specimens</Text>
        </Stack>
      </Stack>
    </Paper>
  );
}

interface Props {
  specimens: ExploreSpecimen[];
  collectors: ExploreCollector[];
}

export function ExploreClient({ specimens, collectors }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('ALL');

  const filtered = specimens.filter((s) => {
    const matchCat = cat === 'ALL' || s.category === cat;
    const q = query.toLowerCase();
    const matchQ = q === '' ||
      s.name.toLowerCase().includes(q) ||
      (s.species ?? '').toLowerCase().includes(q) ||
      s.ownerUsername.toLowerCase().includes(q) ||
      (s.rfCode ?? '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <Box p="lg" maw={1200}>
      {/* Hero */}
      <Stack gap={4} mb="xl" align="center" style={{ textAlign: 'center' }}>
        <Text
          component="h1"
          style={{ fontSize: 26, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
        >
          Discover corals &amp; collectors
        </Text>
        <Text size="sm" c="dimmed">
          {specimens.length} specimen{specimens.length !== 1 ? 's' : ''} from the community
        </Text>
        <TextInput
          mt={8}
          size="md"
          placeholder="Search corals, species, or collectors…"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ width: '100%', maxWidth: 520 }}
        />
      </Stack>

      {/* Collectors */}
      <Box mb="xl">
        <Group gap={6} mb={12}>
          <IconSparkles size={14} color="var(--mantine-color-ocean-6)" />
          <Text style={EYEBROW}>collectors</Text>
        </Group>
        {collectors.length === 0 ? (
          <Text size="sm" c="dimmed" py="sm">No collectors yet.</Text>
        ) : (
          <ScrollArea type="never">
            <Group gap="sm" wrap="nowrap" pb={4}>
              {collectors.map((c) => (
                <CollectorCard key={c.id} c={c} />
              ))}
            </Group>
          </ScrollArea>
        )}
      </Box>

      <Divider mb="xl" />

      {/* Category filter */}
      <Chip.Group value={cat} onChange={(v) => setCat(v as string)}>
        <Group gap={6} mb="md">
          {ALL_CATS.map((c) => (
            <Chip key={c.value} value={c.value} size="sm" radius="xl" variant="light">
              {c.label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      <Text style={EYEBROW} mb="sm">
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
      </Text>

      {filtered.length > 0 ? (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
          {filtered.map((s) => (
            <SpecimenCard key={s.id} s={s} />
          ))}
        </SimpleGrid>
      ) : (
        <Stack align="center" py={60} gap={8}>
          <Text c="dimmed" size="sm">No specimens match your filters.</Text>
          <Anchor size="sm" fw={600} onClick={() => { setQuery(''); setCat('ALL'); }}>
            Clear filters
          </Anchor>
        </Stack>
      )}
    </Box>
  );
}
