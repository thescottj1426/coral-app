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
  Select,
} from '@mantine/core';
import { IconPlus, IconSearch, IconLeaf, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';
import Link from 'next/link';
import { CategoryBadge } from '@/components/coral/CategoryBadge';
import { CoralThumb } from '@/components/coral/CoralThumb';
import { AddCoralDrawer } from '@/components/coral/AddCoralDrawer';
import type { CoralCategory } from '@/theme/theme';

interface Coral {
  rfCode: string;
  name: string;
  species: string;
  category: CoralCategory;
  tank: string;
  genDepth: number;
  fragsProduced: number;
  addedDate: string;
}

const CORALS: Coral[] = [
  { rfCode: 'RF-4F2K', name: 'Oregon Tort',       species: 'Acropora tortuosa',     category: 'SPS',    tank: 'The 90',          genDepth: 2, fragsProduced: 2, addedDate: 'Jan 2025' },
  { rfCode: 'RF-A1B3', name: 'Strawberry Shortcake', species: 'Acropora microclados', category: 'SPS', tank: 'The 90',          genDepth: 1, fragsProduced: 0, addedDate: 'Feb 2025' },
  { rfCode: 'RF-C8D2', name: 'Hellfire Torch',     species: 'Euphyllia glabrescens', category: 'LPS',    tank: 'The 90',          genDepth: 0, fragsProduced: 1, addedDate: 'Mar 2025' },
  { rfCode: 'RF-E5F7', name: 'Rasta Zoa',          species: 'Zoanthus sp.',          category: 'ZOA',    tank: 'The 90',          genDepth: 3, fragsProduced: 5, addedDate: 'Nov 2024' },
  { rfCode: 'RF-G9H4', name: 'Utter Chaos',        species: 'Zoanthus sp.',          category: 'ZOA',    tank: 'Nano Brain Pico', genDepth: 1, fragsProduced: 0, addedDate: 'Apr 2025' },
  { rfCode: 'RF-I2J6', name: 'Green Star Polyp',   species: 'Briareum asbestinum',   category: 'SOFTIE', tank: 'Nano Brain Pico', genDepth: 0, fragsProduced: 3, addedDate: 'Dec 2024' },
  { rfCode: 'RF-K3L8', name: 'Acanthastrea Lord',  species: 'Acanthastrea lordhowensis', category: 'LPS', tank: 'The 90',       genDepth: 2, fragsProduced: 0, addedDate: 'May 2025' },
  { rfCode: 'RF-M7N1', name: 'Rose Bubble Tip',    species: 'Entacmaea quadricolor',  category: 'ANEMONE', tank: 'The 90',       genDepth: 1, fragsProduced: 2, addedDate: 'Jan 2025' },
];

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function CoralCard({ coral }: { coral: Coral }) {
  return (
    <Paper
      component={Link}
      href={`/corals/${coral.rfCode}`}
      withBorder
      style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }}
    >
      {/* Identity tile */}
      <CoralThumb
        rfCode={coral.rfCode}
        size={0}
        style={{
          width: '100%',
          height: 80,
          borderRadius: '8px 8px 0 0',
        }}
      />

      <Stack gap={6} p="sm">
        <Group gap={6} wrap="nowrap" justify="space-between">
          <Text size="sm" fw={700} truncate style={{ flex: 1 }}>
            {coral.name}
          </Text>
          <CategoryBadge category={coral.category} />
        </Group>

        <Text size="xs" c="dimmed" truncate style={{ fontStyle: 'italic' }}>
          {coral.species}
        </Text>

        <Group gap={0} justify="space-between">
          <Text style={EYEBROW}>{coral.tank}</Text>
          <Text
            style={{
              fontFamily: 'var(--font-ibm-plex-mono), monospace',
              fontSize: 10,
              color: 'var(--mantine-color-dimmed)',
            }}
          >
            {coral.rfCode}
          </Text>
        </Group>

        <Group gap={12} mt={2}>
          {coral.genDepth > 0 && (
            <Group gap={4}>
              <IconLeaf size={11} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="teal.7">Gen {coral.genDepth}</Text>
            </Group>
          )}
          {coral.fragsProduced > 0 && (
            <Text size="xs" c="dimmed">{coral.fragsProduced} frags</Text>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

export default function MyCoralsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box p="lg" maw={1200}>
      <AddCoralDrawer opened={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text
            component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            My Corals
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {CORALS.length} corals across 2 tanks
          </Text>
        </div>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setDrawerOpen(true)}>
          Add coral
        </Button>
      </Group>

      {/* Filters */}
      <Group gap="sm" mb="lg" wrap="nowrap">
        <TextInput
          placeholder="Search corals…"
          leftSection={<IconSearch size={14} />}
          style={{ flex: 1, maxWidth: 280 }}
        />
        <Select
          placeholder="All tanks"
          data={['The 90', 'Nano Brain Pico']}
          clearable
          style={{ width: 180 }}
        />
        <Select
          placeholder="All categories"
          data={['SPS', 'LPS', 'Softie', 'Zoa', 'Anemone']}
          clearable
          style={{ width: 180 }}
        />
      </Group>

      {/* Tabs */}
      <Tabs defaultValue="all" mb="md">
        <Tabs.List>
          <Tabs.Tab value="all" rightSection={<Badge size="xs" variant="light">{CORALS.length}</Badge>}>
            All
          </Tabs.Tab>
          <Tabs.Tab value="sps" rightSection={<Badge size="xs" variant="light" color="blue">2</Badge>}>
            SPS
          </Tabs.Tab>
          <Tabs.Tab value="lps" rightSection={<Badge size="xs" variant="light" color="yellow">2</Badge>}>
            LPS
          </Tabs.Tab>
          <Tabs.Tab value="zoa" rightSection={<Badge size="xs" variant="light" color="grape">2</Badge>}>
            Zoa
          </Tabs.Tab>
          <Tabs.Tab value="other">
            Other
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {CORALS.map((c) => (
              <CoralCard key={c.rfCode} coral={c} />
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="sps" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {CORALS.filter((c) => c.category === 'SPS').map((c) => (
              <CoralCard key={c.rfCode} coral={c} />
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="lps" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {CORALS.filter((c) => c.category === 'LPS').map((c) => (
              <CoralCard key={c.rfCode} coral={c} />
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="zoa" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {CORALS.filter((c) => c.category === 'ZOA').map((c) => (
              <CoralCard key={c.rfCode} coral={c} />
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="other" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {CORALS.filter((c) => !['SPS', 'LPS', 'ZOA'].includes(c.category)).map((c) => (
              <CoralCard key={c.rfCode} coral={c} />
            ))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
