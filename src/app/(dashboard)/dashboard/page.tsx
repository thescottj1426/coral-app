import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Group,
  Stack,
  Text,
  Paper,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import {
  IconSeeding,
  IconArrowRight,
  IconArrowLeft,
  IconMessageCircle,
  IconCompass,
  IconPlus,
} from '@tabler/icons-react';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import styles from './dashboard.module.css';
import { getDashboardStats, getRecentCorals, getMyListings, getMyActivity, type MyActivity } from '@/app/actions/dashboard';
import { ClaimWidget } from '@/components/dashboard/ClaimWidget';
import { AddCoralButton } from '@/components/dashboard/AddCoralButton';
import { coralIdentityGradient } from '@/theme/theme';
import type { DashboardCoral, MyListing } from '@/app/actions/dashboard';

export const dynamic = 'force-dynamic';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function coralGradient(seed: string, hue?: number | null) {
  if (hue != null) return `linear-gradient(135deg, oklch(0.76 0.11 ${hue}), oklch(0.5 0.13 ${hue}))`;
  return coralIdentityGradient(seed);
}

function KpiCard({ value, label, icon, color }: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Paper withBorder p="md" className={styles.kpiCard}>
      <Group justify="space-between" align="flex-start" mb={8}>
        <ThemeIcon size={36} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
      <Text style={{ fontSize: 28, fontFamily: 'var(--font-sora)', fontWeight: 700, lineHeight: 1 }}>
        {value}
      </Text>
      <Text size="xs" c="dimmed" fw={500} mt={4}>{label}</Text>
    </Paper>
  );
}

function RecentCoralCard({ coral }: { coral: DashboardCoral }) {
  const href = `/collection/${coral.rfCode ?? coral.id}`;
  return (
    <Link href={href} className={styles.coralCard}>
      <Paper withBorder style={{ overflow: 'hidden' }}>
        <Box style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
          {coral.coverUrl ? (
            <Image src={coral.coverUrl} alt={coral.name} fill style={{ objectFit: 'cover' }} sizes="25vw" />
          ) : (
            <Box style={{ height: 180, background: coralGradient(coral.id, coral.identityHue) }} />
          )}
          <Box style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '32px 10px 10px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          }}>
            <Text size="sm" fw={700} truncate style={{ color: '#fff', lineHeight: 1.3 }}>{coral.name}</Text>
            {coral.category && (
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{coral.category}</Text>
            )}
          </Box>
        </Box>
      </Paper>
    </Link>
  );
}

const ACTIVITY_COLORS: Record<string, string> = {
  coral: 'var(--mantine-color-ocean-5)',
  lineage: 'var(--mantine-color-teal-5)',
  listing: 'var(--mantine-color-orange-5)',
};

function ActivityRow({ item, first }: { item: MyActivity; first: boolean }) {
  const description =
    item.kind === 'lineage'
      ? <>linked <strong>{item.specimenName}</strong> to <strong>{item.parentName}</strong></>
      : item.kind === 'listing'
      ? <>listed frags of <strong>{item.specimenName}</strong></>
      : <>added <strong>{item.specimenName}</strong></>;

  const time = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Group
      gap={10}
      py={8}
      wrap="nowrap"
      style={first ? undefined : { borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      <Box style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        background: ACTIVITY_COLORS[item.kind] ?? 'var(--mantine-color-gray-4)',
      }} />
      <Text size="xs" style={{ flex: 1, lineHeight: 1.4 }}>{description}</Text>
      {item.specimenRfCode && (
        <Text size="xs" style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: 'var(--mantine-color-dimmed)', flexShrink: 0 }}>
          {item.specimenRfCode}
        </Text>
      )}
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{time}</Text>
    </Group>
  );
}

function ListingRow({ listing, first }: { listing: MyListing; first: boolean }) {
  return (
    <Group
      gap="xs"
      py={8}
      wrap="nowrap"
      style={first ? undefined : { borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      <Box
        style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: coralGradient(listing.coralId, listing.identityHue),
        }}
      />
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={600} truncate>{listing.coralName}</Text>
        <Text size="xs" c="dimmed">{listing.qty != null ? `${listing.qty} available` : 'qty TBD'}</Text>
      </Stack>
      {listing.price != null && (
        <Text size="sm" fw={600}>${listing.price}</Text>
      )}
    </Group>
  );
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const userId = session.user.id;

  const [stats, recentCorals, listings, activity, userRow] = await Promise.all([
    getDashboardStats(userId),
    getRecentCorals(userId, 8),
    getMyListings(userId),
    getMyActivity(userId, 8),
    pool.query<{ displayName: string | null; username: string }>(
      'SELECT "displayName", username FROM public."User" WHERE id = $1',
      [userId]
    ),
  ]);

  const user = userRow.rows[0];
  const fullName = user?.displayName ?? session.user.name ?? user?.username ?? 'there';
  const firstName = fullName.split(' ')[0];

  return (
    <Box p={{ base: 'sm', md: 'lg' }} maw={1400}>
      {/* Hero */}
      <Paper withBorder p="lg" mb="md" className={styles.hero}>
        <Group justify="space-between" align="center">
          <div>
            <Text
              component="h1"
              style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0, lineHeight: 1.2 }}
            >
              {firstName}&apos;s reef
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {stats.coralCount === 0
                ? 'Start building your collection'
                : `${stats.coralCount} specimen${stats.coralCount === 1 ? '' : 's'} catalogued`}
            </Text>
          </div>
          <AddCoralButton />
        </Group>
      </Paper>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="md" spacing="sm">
        <KpiCard value={stats.coralCount} label="Corals" icon={<IconSeeding size={18} />} color="ocean" />
        <KpiCard value={stats.fragsProduced} label="Frags given" icon={<IconArrowRight size={18} />} color="teal" />
        <KpiCard value={stats.fragsReceived} label="Frags received" icon={<IconArrowLeft size={18} />} color="violet" />
        <KpiCard value={stats.threadCount} label="Threads" icon={<IconMessageCircle size={18} />} color="orange" />
      </SimpleGrid>

      {/* Quick actions */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md" spacing="sm">
        <Link href="/explore" style={{ textDecoration: 'none' }}>
          <Paper withBorder p="md" className={styles.quickAction}>
            <Group gap="sm">
              <ThemeIcon size={36} radius="md" color="ocean" variant="light">
                <IconCompass size={18} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600}>Explore community</Text>
                <Text size="xs" c="dimmed">Browse specimens from other keepers</Text>
              </div>
            </Group>
          </Paper>
        </Link>
        <Link href="/discuss" style={{ textDecoration: 'none' }}>
          <Paper withBorder p="md" className={styles.quickAction}>
            <Group gap="sm">
              <ThemeIcon size={36} radius="md" color="teal" variant="light">
                <IconMessageCircle size={18} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={600}>Community discussions</Text>
                <Text size="xs" c="dimmed">Ask questions, share knowledge</Text>
              </div>
            </Group>
          </Paper>
        </Link>
      </SimpleGrid>

      {/* Main grid */}
      <div className={styles.mainGrid}>
        {/* Left */}
        <Stack gap="md">
          {/* Recent corals */}
          <div>
            <Group justify="space-between" align="center" mb={10}>
              <Text style={EYEBROW}>recent corals</Text>
              <Link href="/collection" style={{ fontSize: 12, fontWeight: 600, color: 'var(--mantine-primary-color-filled)', textDecoration: 'none' }}>
                View all →
              </Link>
            </Group>
            {recentCorals.length > 0 ? (
              <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xs">
                {recentCorals.map((c) => (
                  <RecentCoralCard key={c.id} coral={c} />
                ))}
              </SimpleGrid>
            ) : (
              <Paper withBorder p="xl" style={{ textAlign: 'center' }}>
                <ThemeIcon size={48} radius="xl" color="ocean" variant="light" mx="auto" mb="sm">
                  <IconPlus size={24} />
                </ThemeIcon>
                <Text size="sm" fw={500} mb={4}>Your chest is empty</Text>
                <Text size="xs" c="dimmed">Add your first specimen to start building your collection</Text>
              </Paper>
            )}
          </div>

          {/* Activity */}
          <Paper withBorder p="md">
            <Group justify="space-between" align="center" mb={4}>
              <Text style={EYEBROW}>your activity</Text>
              <Link href="/feed" style={{ fontSize: 12, fontWeight: 600, color: 'var(--mantine-primary-color-filled)', textDecoration: 'none' }}>
                Community feed →
              </Link>
            </Group>
            {activity.length > 0 ? (
              activity.map((item, i) => (
                <ActivityRow key={item.id} item={item} first={i === 0} />
              ))
            ) : (
              <Text size="sm" c="dimmed" pt={4}>No activity yet — add your first specimen to get started.</Text>
            )}
          </Paper>
        </Stack>

        {/* Right */}
        <Stack gap="md">
          <ClaimWidget />

          {listings.length > 0 && (
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>your listings</Text>
              <Stack gap={0}>
                {listings.map((l, i) => (
                  <ListingRow key={l.id} listing={l} first={i === 0} />
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </div>
    </Box>
  );
}
