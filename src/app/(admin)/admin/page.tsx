import Link from 'next/link';
import { Box, Group, Paper, SimpleGrid, Stack, Text, Button } from '@mantine/core';
import {
  IconPhoto,
  IconFlag,
  IconUsers,
  IconSeeding,
  IconChevronRight,
} from '@tabler/icons-react';
import { getAdminStats } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

export default async function AdminPage() {
  const stats = await getAdminStats();

  const kpis = [
    { label: 'Pending Photos', value: stats.pendingPhotos, icon: IconPhoto, color: 'yellow', href: '/admin/photos' },
    { label: 'Open Reports',   value: stats.openReports,   icon: IconFlag,  color: 'red',    href: '/admin/reports' },
    { label: 'Total Users',    value: stats.totalUsers,    icon: IconUsers, color: 'ocean',  href: null },
    { label: 'Total Corals',   value: stats.totalCorals,   icon: IconSeeding, color: 'teal', href: null },
  ];

  return (
    <Box p="lg" maw={900}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Text
            component="h1"
            style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}
          >
            Admin
          </Text>
          <Text size="sm" c="dimmed">Moderation overview</Text>
        </Stack>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {kpis.map(({ label, value, icon: Icon, color, href }) => (
            <Paper key={label} withBorder p="md" radius="md"
              style={href ? { cursor: 'pointer' } : undefined}
            >
              <Group gap={10} mb={8}>
                <Icon size={18} color={`var(--mantine-color-${color}-6)`} />
                <Text style={EYEBROW}>{label}</Text>
              </Group>
              <Text
                style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-sora)', lineHeight: 1 }}
                c={value > 0 && (label.includes('Pending') || label.includes('Report')) ? color : undefined}
              >
                {value}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>

        <Group gap="md">
          <Link href="/admin/photos" style={{ textDecoration: 'none' }}>
            <Button
              component="a"
              leftSection={<IconPhoto size={16} />}
              rightSection={<IconChevronRight size={14} />}
              variant="light"
              color="yellow"
            >
              Review Photos ({stats.pendingPhotos})
            </Button>
          </Link>
          <Link href="/admin/reports" style={{ textDecoration: 'none' }}>
            <Button
              component="a"
              leftSection={<IconFlag size={16} />}
              rightSection={<IconChevronRight size={14} />}
              variant="light"
              color="red"
            >
              Review Reports ({stats.openReports})
            </Button>
          </Link>
        </Group>
      </Stack>
    </Box>
  );
}
