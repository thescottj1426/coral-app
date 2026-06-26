'use client';

import {
  Box,
  Group,
  Stack,
  Text,
  Button,
  Paper,
  Badge,
  SimpleGrid,
  Tabs,
  Divider,
  Anchor,
  ThemeIcon,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import {
  IconDroplet,
  IconThermometer,
  IconWind,
  IconPlus,
  IconChevronRight,
} from '@tabler/icons-react';
import { useState } from 'react';
import Link from 'next/link';
import { CoralThumb } from '@/components/coral/CoralThumb';
import { CategoryBadge } from '@/components/coral/CategoryBadge';
import { AddCoralDrawer } from '@/components/coral/AddCoralDrawer';
import type { CoralCategory } from '@/theme/theme';

// Stub — real impl would use params.id
const TANK = {
  id: '1',
  name: 'The 90',
  type: 'Reef',
  volume: 90,
  corals: 41,
  hue: 210,
};

const PARAMS = [
  { label: 'Alkalinity', value: '8.5', unit: 'dKH', ok: true,  icon: IconDroplet,     target: '8.3–8.5',  chartKey: 'alk'  },
  { label: 'Calcium',    value: '420',  unit: 'ppm', ok: true,  icon: IconDroplet,     target: '400–450',  chartKey: 'ca'   },
  { label: 'Magnesium',  value: '1280', unit: 'ppm', ok: true,  icon: IconDroplet,     target: '1250–1350',chartKey: 'mg'   },
  { label: 'Temp',       value: '78.2', unit: '°F',  ok: true,  icon: IconThermometer, target: '77–79',    chartKey: 'temp' },
  { label: 'Salinity',   value: '1.025',unit: 'SG',  ok: true,  icon: IconWind,        target: '1.025–1.026', chartKey: 'sal' },
];

const ALK_SERIES = [8.4,8.5,8.3,8.4,8.6,8.5,8.4,8.2,8.3,8.4,8.5,8.5,8.6,8.5].map((v,i)=>({day:i+1,v}));
const CA_SERIES  = [415,418,420,422,419,420,421,420,418,420,422,421,420,420].map((v,i)=>({day:i+1,v}));

interface CoralRow {
  rfCode: string;
  name: string;
  category: CoralCategory;
  addedDate: string;
}

const CORALS: CoralRow[] = [
  { rfCode: 'RF-4F2K', name: 'Oregon Tort',          category: 'SPS',    addedDate: 'Jan 2025' },
  { rfCode: 'RF-A1B3', name: 'Strawberry Shortcake', category: 'SPS',    addedDate: 'Feb 2025' },
  { rfCode: 'RF-C8D2', name: 'Hellfire Torch',        category: 'LPS',    addedDate: 'Mar 2025' },
  { rfCode: 'RF-E5F7', name: 'Rasta Zoa',             category: 'ZOA',    addedDate: 'Nov 2024' },
  { rfCode: 'RF-K3L8', name: 'Acanthastrea Lord',     category: 'LPS',    addedDate: 'May 2025' },
  { rfCode: 'RF-M7N1', name: 'Rose Bubble Tip',       category: 'ANEMONE',addedDate: 'Jan 2025' },
];

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function tankGradient(hue: number) {
  return `linear-gradient(135deg, oklch(0.72 0.12 ${hue}), oklch(0.48 0.14 ${hue}))`;
}

function ParamCard({ p }: { p: typeof PARAMS[0] }) {
  const Icon = p.icon;
  return (
    <Paper withBorder p="md">
      <Group gap={8} mb={6}>
        <ThemeIcon size={26} variant="light" color={p.ok ? 'ocean' : 'orange'} radius="sm">
          <Icon size={13} />
        </ThemeIcon>
        <Text size="xs" c="dimmed" fw={500}>{p.label}</Text>
      </Group>
      <Text style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-sora)', lineHeight: 1 }}>
        {p.value}
        <Text span size="xs" c="dimmed" fw={400}> {p.unit}</Text>
      </Text>
      <Text size="xs" c="dimmed" mt={2}>Target {p.target}</Text>
    </Paper>
  );
}

export default function TankDetailPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box p="lg" maw={1100}>
      <AddCoralDrawer opened={drawerOpen} onClose={() => setDrawerOpen(false)} defaultTank="1" />
      {/* Hero */}
      <Box
        style={{
          height: 160,
          borderRadius: 12,
          background: tankGradient(TANK.hue),
          marginBottom: 24,
          position: 'relative',
        }}
      >
        <Group
          style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}
          justify="space-between"
          align="flex-end"
        >
          <div>
            <Text
              style={{
                fontSize: 26,
                fontFamily: 'var(--font-sora)',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}
            >
              {TANK.name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              {TANK.type} · {TANK.volume} gal · {TANK.corals} corals
            </Text>
          </div>
          <Group gap="xs">
            <Button
              size="xs"
              variant="white"
              leftSection={<IconThermometer size={13} />}
            >
              Log params
            </Button>
            <Button size="xs" variant="white" leftSection={<IconPlus size={13} />} onClick={() => setDrawerOpen(true)}>
              Add coral
            </Button>
          </Group>
        </Group>
      </Box>

      <Tabs defaultValue="params">
        <Tabs.List mb="md">
          <Tabs.Tab value="params">Parameters</Tabs.Tab>
          <Tabs.Tab value="corals">Corals ({CORALS.length})</Tabs.Tab>
        </Tabs.List>

        {/* Params tab */}
        <Tabs.Panel value="params">
          <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm" mb="xl">
            {PARAMS.map((p) => (
              <ParamCard key={p.label} p={p} />
            ))}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Alk chart */}
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>
                alkalinity · 14 days
              </Text>
              <AreaChart
                h={110}
                data={ALK_SERIES}
                dataKey="day"
                series={[{ name: 'v', color: 'ocean.6' }]}
                curveType="natural"
                withDots={false}
                withXAxis={false}
                withTooltip
                fillOpacity={0.08}
              />
              <Group justify="space-between" mt={6}>
                <Text size="xs" c="dimmed">Target 8.3–8.5 dKH</Text>
                <Badge color="teal" variant="light" size="xs">On track</Badge>
              </Group>
            </Paper>

            {/* Ca chart */}
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>
                calcium · 14 days
              </Text>
              <AreaChart
                h={110}
                data={CA_SERIES}
                dataKey="day"
                series={[{ name: 'v', color: 'teal.6' }]}
                curveType="natural"
                withDots={false}
                withXAxis={false}
                withTooltip
                fillOpacity={0.08}
              />
              <Group justify="space-between" mt={6}>
                <Text size="xs" c="dimmed">Target 400–450 ppm</Text>
                <Badge color="teal" variant="light" size="xs">On track</Badge>
              </Group>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        {/* Corals tab */}
        <Tabs.Panel value="corals">
          <Stack gap={0}>
            {CORALS.map((c, i) => (
              <Box
                key={c.rfCode}
                component={Link}
                href={`/collection/${c.rfCode}`}
                py={12}
                px={4}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  borderTop: i > 0 ? '1px solid var(--mantine-color-default-border)' : undefined,
                  cursor: 'pointer',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <CoralThumb rfCode={c.rfCode} size={36} />
                <Stack gap={1} style={{ flex: 1 }}>
                  <Text size="sm" fw={600}>{c.name}</Text>
                  <Text size="xs" c="dimmed">Added {c.addedDate}</Text>
                </Stack>
                <CategoryBadge category={c.category} />
                <Text
                  size="xs"
                  style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--mantine-color-dimmed)' }}
                >
                  {c.rfCode}
                </Text>
                <IconChevronRight size={14} color="var(--mantine-color-gray-4)" />
              </Box>
            ))}
          </Stack>

          <Divider my="md" />
          <Group justify="center">
            <Anchor component={Link} href="/corals" size="sm" fw={600}>
              View all corals →
            </Anchor>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
