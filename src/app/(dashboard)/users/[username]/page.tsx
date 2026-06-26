import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import {
  Box,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Anchor,
} from '@mantine/core';
import {
  IconMapPin,
  IconCalendar,
  IconLink,
  IconCheck,
  IconEdit,
  IconMessage,
  IconCamera,
  IconStar,
  IconTruck,
  IconLeaf,
  IconChevronRight,
} from '@tabler/icons-react';
import { auth } from '@/lib/auth';
import {
  getUserProfile,
  getUserSpecimens,
  getUserBloodlines,
} from '@/app/actions/users';
import { coralIdentityGradient } from '@/theme/theme';
import { CategoryBadge } from '@/components/coral/CategoryBadge';
import { ProfileTabs } from './ProfileTabs';
import css from './profile.module.css';

export const dynamic = 'force-dynamic';

function identityGrad(hue: number) {
  return `linear-gradient(135deg, oklch(0.72 0.13 ${hue}), oklch(0.5 0.15 ${hue}))`;
}

function initials(name: string | null, username: string) {
  const src = name ?? username;
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span className={css.eyebrow} style={style}>{children}</span>;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [profile, session] = await Promise.all([
    getUserProfile(username),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ]);

  if (!profile) notFound();
  const p = profile!;

  const own = session?.user?.id === p.id;
  const specimens = await getUserSpecimens(p.id);
  const bloodlines = await getUserBloodlines(p.id);

  const displayName = p.displayName ?? p.username;
  const avatarHue = 25;
  const coverGrad = `linear-gradient(120deg, oklch(0.55 0.16 25), oklch(0.5 0.14 200))`;
  const locationLabel =
    p.locationCity && p.locationState
      ? `${p.locationCity}, ${p.locationState}`
      : p.location;

  const stats = [
    { v: p.specimenCount, k: 'Animals' },
    { v: p.bloodlineCount, k: 'Bloodlines' },
    { v: p.followerCount, k: 'Followers' },
    { v: p.followingCount, k: 'Following' },
  ];

  // ── Collection card ──────────────────────────────────────────
  function CollectionCard() {
    const shown = specimens.slice(0, 6);
    return (
      <Paper withBorder style={{ overflow: 'hidden' }}>
        <Group justify="space-between" align="center" px="md" pt="md" pb={10}>
          <Eyebrow>featured collection</Eyebrow>
          {specimens.length > 6 && (
            <Anchor component={Link} href={`/users/${username}/collection`} size="xs" fw={600}>
              View all {specimens.length} →
            </Anchor>
          )}
        </Group>
        <Box px="md" pb="md">
          <SimpleGrid cols={3} spacing={10}>
            {shown.length === 0 && (
              <Text size="xs" c="dimmed" style={{ gridColumn: '1 / -1' }}>No animals yet.</Text>
            )}
            {shown.map((s) => (
              <Link key={s.id} href={`/collection/${s.id}`} style={{ textDecoration: 'none' }}>
                <div className={css.colCard}>
                  <div
                    className={css.colImg}
                    style={{
                      background: s.coverPhotoUrl
                        ? `url(${s.coverPhotoUrl}) center/cover`
                        : coralIdentityGradient(s.rfCode ?? s.id),
                    }}
                  />
                  {s.rfCode && <span className={css.colGen}>{s.rfCode}</span>}
                  <div className={css.colCap}>
                    <div className={css.colName}>{s.name}</div>
                    {s.species && <div className={css.colCode}>{s.species}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </SimpleGrid>
        </Box>
      </Paper>
    );
  }

  // ── Bloodlines card ──────────────────────────────────────────
  function BloodlinesCard() {
    return (
      <Paper withBorder>
        <Group justify="space-between" align="center" px="md" pt="md" pb={10}>
          <Eyebrow>bloodlines founded · {bloodlines.length}</Eyebrow>
        </Group>
        <Stack gap={0} px="md" pb="md">
          {bloodlines.length === 0 && (
            <Text size="xs" c="dimmed">No bloodlines yet.</Text>
          )}
          {bloodlines.map((b) => (
            <div key={b.rootId} className={css.bloodlineCard} style={{ marginBottom: 10 }}>
              <div className={css.thumbStack}>
                <div style={{ background: coralIdentityGradient(b.rfCode ?? b.rootId) }} />
              </div>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600} truncate>{b.rootName}</Text>
                {b.rfCode && (
                  <Text size="xs" c="dimmed" ff="monospace">{b.rfCode}</Text>
                )}
              </Stack>
              <div className={css.bloodlineStat}>
                <div className={css.bloodlineStatValue}>{b.fragCount}</div>
                <div className={css.bloodlineStatLabel}>Traced</div>
              </div>
              <div className={css.bloodlineStat}>
                <div className={css.bloodlineStatValue}>{b.keeperCount}</div>
                <div className={css.bloodlineStatLabel}>Keepers</div>
              </div>
              <Button
                component={Link}
                href={`/collection/${b.rootId}/pedigree`}
                size="xs"
                variant="default"
              >
                Tree
              </Button>
            </div>
          ))}
        </Stack>
      </Paper>
    );
  }

  // ── About card ───────────────────────────────────────────────
  function AboutCard() {
    if (!p.bio && (!p.specialty || p.specialty.length === 0)) return null;
    return (
      <Paper withBorder p="md">
        <Eyebrow style={{ marginBottom: 8, display: 'block' }}>about</Eyebrow>
        {p.bio && (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>{p.bio}</Text>
        )}
        {p.specialty && p.specialty.length > 0 && (
          <Group gap={6} mt={12} wrap="wrap">
            {p.specialty.map((s) => (
              <Badge key={s} variant="light" color="gray" size="sm" style={{ textTransform: 'none', fontWeight: 500 }}>
                {s}
              </Badge>
            ))}
          </Group>
        )}
      </Paper>
    );
  }

  // ── Seller card ──────────────────────────────────────────────
  function SellerCard() {
    if (!p.isSeller) return null;
    return (
      <Paper withBorder p="md" style={{ background: 'var(--mantine-color-ocean-0)', borderColor: 'var(--mantine-color-ocean-1)' }}>
        <Group gap={8} mb={6}>
          <IconTruck size={16} color="var(--mantine-color-ocean-7)" />
          <Text fw={600} size="sm" c="ocean.9">{p.shopName ?? `${displayName}'s Shop`}</Text>
        </Group>
        {p.shopBio && (
          <Text size="xs" c="ocean.7">{p.shopBio}</Text>
        )}
        <Button size="xs" variant="light" color="ocean" fullWidth mt={10}>
          Visit shop
        </Button>
      </Paper>
    );
  }

  // ── Category breakdown card ──────────────────────────────────
  function CategoryCard() {
    const entries = Object.entries(p.categoryBreakdown);
    if (entries.length === 0) return null;
    return (
      <Paper withBorder p="md">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>collection breakdown</Eyebrow>
        <Stack gap={6}>
          {entries.map(([cat, count]) => (
            <Group key={cat} justify="space-between">
              <CategoryBadge category={cat as never} />
              <Text size="xs" c="dimmed">{count}</Text>
            </Group>
          ))}
        </Stack>
      </Paper>
    );
  }

  // ── Tabs panels ──────────────────────────────────────────────
  const overviewPanel = (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" style={{ alignItems: 'start' }}>
      {/* left column */}
      <Stack gap="md">
        <CollectionCard />
        <BloodlinesCard />
      </Stack>
      {/* right column */}
      <Stack gap="md">
        <AboutCard />
        <SellerCard />
        <CategoryCard />
      </Stack>
    </SimpleGrid>
  );

  const collectionPanel = (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
      {specimens.length === 0 && (
        <Text size="sm" c="dimmed">No animals yet.</Text>
      )}
      {specimens.map((s) => (
        <Link key={s.id} href={`/collection/${s.id}`} style={{ textDecoration: 'none' }}>
          <Paper withBorder style={{ overflow: 'hidden' }}>
            <div
              style={{
                height: 100,
                background: s.coverPhotoUrl
                  ? `url(${s.coverPhotoUrl}) center/cover`
                  : coralIdentityGradient(s.rfCode ?? s.id),
              }}
            />
            <Stack gap={4} p="sm">
              <Group gap={6} justify="space-between" wrap="nowrap">
                <Text size="sm" fw={700} truncate style={{ flex: 1 }}>{s.name}</Text>
                {s.category && <CategoryBadge category={s.category} />}
              </Group>
              {s.species && (
                <Text size="xs" c="dimmed" truncate style={{ fontStyle: 'italic' }}>{s.species}</Text>
              )}
            </Stack>
          </Paper>
        </Link>
      ))}
    </SimpleGrid>
  );

  const bloodlinesPanel = (
    <Stack gap="sm">
      {bloodlines.length === 0 && (
        <Text size="sm" c="dimmed">No bloodlines yet.</Text>
      )}
      {bloodlines.map((b) => (
        <Paper key={b.rootId} withBorder p="md">
          <Group gap={12} wrap="nowrap">
            <div style={{ width: 44, height: 44, borderRadius: 10, background: coralIdentityGradient(b.rfCode ?? b.rootId), flexShrink: 0 }} />
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>{b.rootName}</Text>
              {b.rfCode && <Text size="xs" c="dimmed" ff="monospace">{b.rfCode}</Text>}
              <Group gap={12}>
                <Group gap={4}>
                  <IconLeaf size={11} color="var(--mantine-color-teal-6)" />
                  <Text size="xs" c="teal.7">{b.fragCount} frags traced</Text>
                </Group>
                <Text size="xs" c="dimmed">{b.keeperCount} keepers</Text>
              </Group>
            </Stack>
            <Button component={Link} href={`/collection/${b.rootId}/pedigree`} size="xs" variant="default" rightSection={<IconChevronRight size={12} />}>
              Tree
            </Button>
          </Group>
        </Paper>
      ))}
    </Stack>
  );

  return (
    <Box maw={1080} mx="auto">
      {/* Header card */}
      <Paper withBorder style={{ overflow: 'hidden' }} mb="md">
        {/* Cover */}
        <div className={css.cover} style={{ background: coverGrad }}>
          {own && (
            <button className={css.editCoverBtn}>
              <IconCamera size={13} />
              Edit cover
            </button>
          )}
        </div>

        {/* Identity */}
        <div className={css.identity}>
          <div
            className={css.avatar}
            style={{ background: identityGrad(avatarHue) }}
          >
            {initials(p.displayName, p.username)}
          </div>
          <div className={css.identityMain}>
            <div className={css.nameRow}>
              <span className={css.name}>{displayName}</span>
              {p.verified && (
                <Badge color="ocean" variant="light" size="sm" leftSection={<IconCheck size={10} strokeWidth={3} />}>
                  Verified
                </Badge>
              )}
              <span className={css.handle}>@{p.username}</span>
            </div>
            <div className={css.metaRow}>
              {locationLabel && (
                <span className={css.metaItem}>
                  <IconMapPin size={13} />
                  {locationLabel}
                </span>
              )}
              <span className={css.metaItem}>
                <IconCalendar size={13} />
                Joined {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className={css.actions}>
            {own ? (
              <Button variant="default" size="sm" leftSection={<IconEdit size={14} />}>
                Edit profile
              </Button>
            ) : (
              <>
                <Button variant="default" size="sm" leftSection={<IconMessage size={14} />}>
                  Message
                </Button>
                <Button size="sm">Follow</Button>
              </>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className={css.statsBar}>
          {stats.map(({ v, k }) => (
            <div key={k} className={css.stat}>
              <div className={css.statValue}>{v}</div>
              <div className={css.statLabel}>{k}</div>
            </div>
          ))}
        </div>
      </Paper>

      {/* Tabs */}
      <ProfileTabs
        tabs={[
          { value: 'overview', label: 'Overview', panel: overviewPanel },
          { value: 'collection', label: `Collection ${p.specimenCount}`, count: p.specimenCount, panel: collectionPanel },
          { value: 'bloodlines', label: `Bloodlines ${bloodlines.length}`, count: bloodlines.length, panel: bloodlinesPanel },
        ]}
      />
    </Box>
  );
}
