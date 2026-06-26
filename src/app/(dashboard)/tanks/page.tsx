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
  Progress,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconChevronRight,
  IconDroplet,
  IconThermometer,
  IconWind,
} from '@tabler/icons-react';
import Link from 'next/link';

interface Param {
  label: string;
  value: string;
  unit: string;
  ok: boolean;
  icon: React.ReactNode;
}

interface Tank {
  id: string;
  name: string;
  type: 'Reef' | 'FOWLR' | 'Nano' | 'Frag';
  volume: number;
  corals: number;
  hue: number;
  lastLog: string;
  params: Param[];
  fill: number;
}

const TANKS: Tank[] = [
  {
    id: '1',
    name: 'The 90',
    type: 'Reef',
    volume: 90,
    corals: 41,
    hue: 210,
    lastLog: '14h ago',
    fill: 82,
    params: [
      { label: 'Alkalinity', value: '8.5', unit: 'dKH', ok: true,  icon: <IconDroplet size={12} /> },
      { label: 'Calcium',    value: '420', unit: 'ppm', ok: true,  icon: <IconDroplet size={12} /> },
      { label: 'Magnesium',  value: '1280', unit: 'ppm', ok: true, icon: <IconDroplet size={12} /> },
      { label: 'Temp',       value: '78.2', unit: '°F', ok: true,  icon: <IconThermometer size={12} /> },
      { label: 'Salinity',   value: '1.025', unit: 'SG', ok: true, icon: <IconWind size={12} /> },
    ],
  },
  {
    id: '2',
    name: 'Nano Brain Pico',
    type: 'Nano',
    volume: 16,
    corals: 6,
    hue: 270,
    lastLog: '2d ago',
    fill: 38,
    params: [
      { label: 'Alkalinity', value: '8.1', unit: 'dKH', ok: true,  icon: <IconDroplet size={12} /> },
      { label: 'Calcium',    value: '400', unit: 'ppm', ok: true,  icon: <IconDroplet size={12} /> },
      { label: 'Temp',       value: '77.8', unit: '°F', ok: true,  icon: <IconThermometer size={12} /> },
      { label: 'Salinity',   value: '1.026', unit: 'SG', ok: false, icon: <IconWind size={12} /> },
    ],
  },
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

function TankCard({ tank }: { tank: Tank }) {
  const allOk = tank.params.every((p) => p.ok);

  return (
    <Paper component={Link} href={`/tanks/${tank.id}`} withBorder style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
      {/* Photo band */}
      <Box
        style={{
          height: 110,
          background: tankGradient(tank.hue),
          borderRadius: '8px 8px 0 0',
          position: 'relative',
        }}
      >
        <Badge
          variant="filled"
          size="sm"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {tank.type}
        </Badge>
        <Badge
          variant="filled"
          color={allOk ? 'teal' : 'orange'}
          size="sm"
          style={{ position: 'absolute', top: 10, right: 10 }}
        >
          {allOk ? 'Params OK' : 'Check params'}
        </Badge>
      </Box>

      <Stack gap={10} p="md">
        {/* Name row */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Stack gap={0}>
            <Text fw={700} size="sm">{tank.name}</Text>
            <Text size="xs" c="dimmed">{tank.volume} gal · {tank.corals} corals</Text>
          </Stack>
          <IconChevronRight size={15} color="var(--mantine-color-gray-4)" />
        </Group>

        <Divider />

        {/* Coral fill */}
        <div>
          <Group justify="space-between" mb={4}>
            <Text style={EYEBROW}>capacity</Text>
            <Text style={{ ...EYEBROW, color: undefined }}>{tank.fill}%</Text>
          </Group>
          <Progress value={tank.fill} size="xs" color={tank.fill > 80 ? 'orange' : 'ocean.6'} />
        </div>

        {/* Params snapshot */}
        <SimpleGrid cols={3} spacing={6}>
          {tank.params.slice(0, 3).map((p) => (
            <Stack key={p.label} gap={1} align="center">
              <Text size="xs" fw={700} c={p.ok ? undefined : 'orange'}>
                {p.value}
                <Text span size="xs" c="dimmed"> {p.unit}</Text>
              </Text>
              <Text style={EYEBROW}>{p.label}</Text>
            </Stack>
          ))}
        </SimpleGrid>

        <Text size="xs" c="dimmed">Last log: {tank.lastLog}</Text>
      </Stack>
    </Paper>
  );
}

export default function TanksPage() {
  return (
    <Box p="lg" maw={1000}>
      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Text
            component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            My Tanks
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {TANKS.length} tanks · {TANKS.reduce((s, t) => s + t.corals, 0)} total corals
          </Text>
        </div>
        <Button leftSection={<IconPlus size={14} />}>Add tank</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="md">
        {TANKS.map((t) => (
          <TankCard key={t.id} tank={t} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
