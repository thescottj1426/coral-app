'use client';

import {
  SimpleGrid,
  Paper,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Avatar,
  Anchor,
  Box,
  Code,
} from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import {
  IconThermometer,
  IconPlus,
  IconChevronRight,
} from '@tabler/icons-react';
import { useState } from 'react';
import Link from 'next/link';
import { ClaimWidget } from '@/components/dashboard/ClaimWidget';
import { AddCoralDrawer } from '@/components/coral/AddCoralDrawer';

// ── Stub data ──────────────────────────────────────────────
const USER = { firstName: 'Maya' };

const STATS = [
  { value: '2',  label: 'Tanks',          delta: null },
  { value: '47', label: 'Corals',         delta: '+3 this month' },
  { value: '12', label: 'Frags produced', delta: null },
  { value: '9',  label: 'Frags claimed',  delta: '4 gen max depth' },
];

const TANKS = [
  { id: '1', name: 'The 90',          type: 'Reef',  volume: 90, corals: 41, paramsOk: true },
  { id: '2', name: 'Nano Brain Pico', type: 'Nano', volume: 16, corals: 6,  paramsOk: true },
];

const ACTIVITY = [
  {
    who: 'Reef Raft MN', hue: 210,
    text: ['Reef Raft MN', ' listed ', 'Oregon Tort', ' frags on the Frag Board'],
    boldIdx: [0, 2], time: '2h', coralHue: 210,
  },
  {
    who: 'Nick Tran', hue: 270,
    text: ['Nick Tran', ' claimed your frag '],
    code: 'RF-8B2X',
    textAfter: ' — your line is now 4 generations deep',
    boldIdx: [0], time: '6h', coralHue: null,
  },
  {
    who: 'Tidal Gardens', hue: 160,
    text: ['Tidal Gardens', ' added ', 'Hellfire Torch', ' to The Greenhouse'],
    boldIdx: [0, 2], time: '1d', coralHue: 160,
  },
  {
    who: 'Sasha Kim', hue: 330,
    text: ['Sasha Kim', ' started following you'],
    boldIdx: [0], time: '1d', coralHue: null,
  },
];

const ALK_DATA = [8.4,8.5,8.3,8.4,8.6,8.5,8.4,8.2,8.3,8.4,8.5,8.5,8.6,8.5]
  .map((alk, i) => ({ day: i + 1, alk }));

const LISTINGS = [
  { name: 'Green Slimer',  qty: '6 left',     price: '$25', hue: 120 },
  { name: 'Utter Chaos',   qty: '2 reserved', price: '$45', hue: 40  },
];

// ── Helpers ────────────────────────────────────────────────
function coralGradient(hue: number) {
  return `linear-gradient(135deg, oklch(0.76 0.11 ${hue}), oklch(0.5 0.13 ${hue}))`;
}
function avatarBg(hue: number) {
  return `oklch(0.62 0.1 ${hue})`;
}
function getWeekday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

const EYEBROW_STYLE = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

// ── Sub-components ─────────────────────────────────────────
function KpiCard({ value, label, delta }: { value: string; label: string; delta: string | null }) {
  return (
    <Paper withBorder p="md">
      <Text
        style={{ fontSize: 26, fontFamily: 'var(--font-sora)', fontWeight: 700, lineHeight: 1.1 }}
      >
        {value}
      </Text>
      <Text size="xs" c="dimmed" fw={500} mt={2}>
        {label}
      </Text>
      {delta && (
        <Text size="xs" c="teal.6" mt={4}>
          {delta}
        </Text>
      )}
    </Paper>
  );
}

function TankCard({ tank }: { tank: typeof TANKS[0] }) {
  return (
    <Paper withBorder style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }}>
      <Box
        style={{
          height: 96,
          background: coralGradient(tank.id === '1' ? 210 : 270),
          opacity: 0.6,
        }}
      />
      <Group p="xs" gap="xs" align="center" wrap="nowrap">
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>
            {tank.name}
          </Text>
          <Text size="xs" c="dimmed">
            {tank.type} · {tank.volume} gal · {tank.corals} corals
          </Text>
        </Stack>
        <Badge color="teal" variant="light" size="sm" style={{ flexShrink: 0 }}>
          Params OK
        </Badge>
        <IconChevronRight size={15} color="var(--mantine-color-gray-4)" style={{ flexShrink: 0 }} />
      </Group>
    </Paper>
  );
}

function ActivityRow({ item }: { item: typeof ACTIVITY[0] }) {
  return (
    <Group gap={10} py={8} wrap="nowrap" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      <Avatar
        size={24}
        radius="xl"
        style={{ background: avatarBg(item.hue), flexShrink: 0 }}
      >
        {item.who[0]}
      </Avatar>
      <Text size="xs" style={{ flex: 1, lineHeight: 1.4 }}>
        {item.text.map((chunk, i) =>
          item.boldIdx.includes(i) ? <strong key={i}>{chunk}</strong> : chunk
        )}
        {'code' in item && item.code && (
          <Code style={{ fontSize: 11 }}>{item.code}</Code>
        )}
        {'textAfter' in item && item.textAfter}
      </Text>
      {item.coralHue !== null && (
        <Box
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: coralGradient(item.coralHue!),
            flexShrink: 0,
          }}
        />
      )}
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
        {item.time}
      </Text>
    </Group>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function DashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box p="lg" maw={1400}>
      <AddCoralDrawer opened={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {/* Page head */}
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text component="h1" style={{ fontSize: 26, fontFamily: 'var(--font-sora)', fontWeight: 600, margin: 0 }}>
            Welcome back, {USER.firstName}
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {getWeekday()} · last parameter log 14 hours ago
          </Text>
        </div>
        <Group gap="xs">
          <Button variant="default" leftSection={<IconThermometer size={15} />}>
            Log params
          </Button>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDrawerOpen(true)}>
            Add coral
          </Button>
        </Group>
      </Group>

      {/* KPI row */}
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="md" spacing="sm">
        {STATS.map((s) => (
          <KpiCard key={s.label} {...s} />
        ))}
      </SimpleGrid>

      {/* 2-col main grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" style={{ gridTemplateColumns: '1.7fr 1fr' }}>
        {/* Left column */}
        <Stack gap="md">
          {/* Tanks */}
          <div>
            <Group justify="space-between" align="center" mb={10}>
              <Text style={EYEBROW_STYLE}>your tanks</Text>
              <Button variant="subtle" size="xs" component={Link} href="/tanks">
                Add tank
              </Button>
            </Group>
            <Group gap="xs" grow>
              {TANKS.map((t) => (
                <TankCard key={t.id} tank={t} />
              ))}
            </Group>
          </div>

          {/* Activity feed */}
          <Paper withBorder p="md">
            <Group justify="space-between" align="center" mb={4}>
              <Text style={EYEBROW_STYLE}>recent activity</Text>
              <Anchor component={Link} href="/feed" size="xs" fw={600}>
                Open feed →
              </Anchor>
            </Group>
            {ACTIVITY.map((a, i) => (
              <ActivityRow key={i} item={a} />
            ))}
          </Paper>
        </Stack>

        {/* Right column */}
        <Stack gap="md">
          <ClaimWidget />

          {/* Alk sparkline */}
          <Paper withBorder p="md">
            <Text style={{ ...EYEBROW_STYLE, display: 'block', marginBottom: 8 }}>
              alkalinity · the 90 · 14 days
            </Text>
            <AreaChart
              h={92}
              data={ALK_DATA}
              dataKey="day"
              series={[{ name: 'alk', color: 'ocean.6' }]}
              curveType="natural"
              withDots={false}
              withTooltip={false}
              withXAxis={false}
              withYAxis={false}
              areaChartProps={{ style: { overflow: 'visible' } }}
              fillOpacity={0.07}
            />
            <Group justify="space-between" mt={6}>
              <Text size="xs" c="dimmed">8.5 dKH today</Text>
              <Anchor component={Link} href="/tanks/1" size="xs" fw={600}>
                All parameters →
              </Anchor>
            </Group>
          </Paper>

          {/* Listings (sellers) */}
          <Paper withBorder p="md">
            <Text style={{ ...EYEBROW_STYLE, display: 'block', marginBottom: 8 }}>
              your listings
            </Text>
            <Stack gap={0}>
              {LISTINGS.map((l, i) => (
                <Group
                  key={l.name}
                  gap="xs"
                  py={8}
                  wrap="nowrap"
                  style={i > 0 ? { borderTop: '1px solid var(--mantine-color-default-border)' } : undefined}
                >
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: coralGradient(l.hue),
                      flexShrink: 0,
                    }}
                  />
                  <Stack gap={0} style={{ flex: 1 }}>
                    <Text size="sm" fw={600}>{l.name}</Text>
                    <Text size="xs" c="dimmed">{l.qty}</Text>
                  </Stack>
                  <Text size="sm" fw={600}>{l.price}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </SimpleGrid>
    </Box>
  );
}
