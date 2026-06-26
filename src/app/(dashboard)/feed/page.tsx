import Link from 'next/link';
import {
  Box,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Avatar,
  SegmentedControl,
} from '@mantine/core';
import {
  IconHeart,
  IconMessageCircle,
  IconShare3,
  IconDots,
  IconPhoto,
  IconTag,
  IconScissors,
  IconHelpCircle,
  IconArrowRight,
  IconSeeding,
  IconTrendingUp,
  IconCake,
} from '@tabler/icons-react';
import { coralIdentityGradient } from '@/theme/theme';
import { getFeedItems } from '@/app/actions/feed';
import type { FeedItem } from '@/app/actions/feed';
import css from './feed.module.css';

export const dynamic = 'force-dynamic';

function identGrad(hue: number) {
  return `linear-gradient(135deg, oklch(0.72 0.13 ${hue}), oklch(0.5 0.15 ${hue}))`;
}

function fink(hue: number) {
  return `oklch(0.55 0.16 ${hue})`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function initials(displayName: string | null, username: string) {
  const src = displayName ?? username;
  return src.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

// ── Composer (client-only piece is just a placeholder input) ─────────────────
function Composer() {
  return (
    <Paper withBorder p="md" className={css.composer}>
      <div className={css.composerTop}>
        <Avatar size={40} radius="xl" style={{ background: identGrad(25), color: '#fff', fontWeight: 700 }}>
          M
        </Avatar>
        <div className={css.composerInput}>
          Share an update, ask the community, or post a frag…
        </div>
      </div>
      <div className={css.composerActions}>
        <button className={css.composerChip} style={{ color: fink(200) }}>
          <IconPhoto size={15} /> Photo
        </button>
        <button className={css.composerChip} style={{ color: fink(25) }}>
          <IconTag size={15} /> Tag specimen
        </button>
        <button className={css.composerChip} style={{ color: fink(40) }}>
          <IconScissors size={15} /> List a frag
        </button>
        <button className={css.composerChip} style={{ color: fink(140) }}>
          <IconHelpCircle size={15} /> Ask a question
        </button>
        <Box style={{ flex: 1 }} />
        <Button size="xs">Post</Button>
      </div>
    </Paper>
  );
}

// ── Post card ────────────────────────────────────────────────────────────────
function PostCard({ item }: { item: FeedItem }) {
  const verb =
    item.kind === 'specimen' ? 'added a specimen' :
    item.kind === 'lineage'  ? 'claimed a frag' :
    'listed a frag for sale';

  const embedBg = item.specimenCoverUrl
    ? `url(${item.specimenCoverUrl}) center/cover`
    : item.specimenIdentityHue != null
      ? identGrad(item.specimenIdentityHue)
      : coralIdentityGradient(item.specimenId ?? item.id);

  return (
    <Paper withBorder className={css.post}>
      {/* Head */}
      <div className={css.postHead}>
        <div className={css.postAvatarWrap}>
          <Avatar
            size={40}
            radius="xl"
            style={{ background: identGrad(item.actorHue), color: '#fff', fontWeight: 700 }}
          >
            {initials(item.actorDisplayName, item.actorUsername)}
          </Avatar>
        </div>
        <div className={css.postActor}>
          <span className={css.postActorName}>
            <Link href={`/users/${item.actorUsername}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
              {item.actorDisplayName ?? `@${item.actorUsername}`}
            </Link>
          </span>
          <span className={css.postActorVerb}> {verb}</span>
          <div className={css.postMeta}>
            <span>{timeAgo(item.createdAt)}</span>
          </div>
        </div>
        <button style={{ background: 'none', border: 0, cursor: 'pointer', padding: 6, color: 'var(--mantine-color-dimmed)', borderRadius: 'var(--mantine-radius-md)' }}>
          <IconDots size={17} />
        </button>
      </div>

      {/* Body text for lineage */}
      {item.kind === 'lineage' && item.parentName && (
        <div className={css.postBody}>
          <Text size="sm" c="dimmed">
            Inherited from <Link href={`/collection/${item.parentId}`} style={{ fontWeight: 600, color: 'var(--mantine-color-anchor)' }}>{item.parentName}</Link>
            {item.parentRfCode && <Text span ff="monospace" size="xs" c="dimmed"> · {item.parentRfCode}</Text>}
          </Text>
        </div>
      )}

      {item.specimenNotes && item.kind !== 'lineage' && (
        <div className={css.postBody}>
          <Text size="sm" lineClamp={3}>{item.specimenNotes}</Text>
        </div>
      )}

      {/* Embed */}
      {item.specimenId && (
        <div className={css.embed}>
          <div className={css.embedTile} style={{ background: embedBg }} />
          <div className={css.embedMain}>
            <Group gap={6} align="center">
              <Text size="sm" fw={600}>{item.specimenName}</Text>
              {item.specimenRfCode && (
                <Text ff="monospace" size="xs" c="dimmed">{item.specimenRfCode}</Text>
              )}
            </Group>
            {item.specimenSpecies && (
              <Text size="xs" c="dimmed" fs="italic" mt={1}>{item.specimenSpecies}</Text>
            )}
            {item.specimenCategory && (
              <Badge size="xs" variant="light" mt={6}>{item.specimenCategory}</Badge>
            )}
            {item.kind === 'listing' && item.listingQty != null && (
              <Text size="xs" c="dimmed" mt={4}>{item.listingQty} available</Text>
            )}
          </div>
          {item.kind === 'listing' && item.listingPrice != null ? (
            <Stack gap={6} align="flex-end">
              <Text className={css.embedPrice}>${item.listingPrice}</Text>
              <Button size="xs" variant="light">Reserve</Button>
            </Stack>
          ) : (
            <Link href={`/collection/${item.specimenId}`}>
            <Button component="a" size="xs" variant="default">View</Button>
          </Link>
          )}
        </div>
      )}

      {/* Lineage chip chain */}
      {item.kind === 'lineage' && item.parentId && item.specimenId && (
        <div className={css.linchips}>
          <div className={css.linchip}>
            <div
              className={css.linchipDot}
              style={{ background: item.parentHue != null ? identGrad(item.parentHue) : coralIdentityGradient(item.parentId) }}
            />
            {item.parentRfCode && <span className={css.linchipCode}>{item.parentRfCode}</span>}
            {!item.parentRfCode && <span className={css.linchipCode}>{item.parentName}</span>}
          </div>
          <IconArrowRight size={12} color="var(--mantine-color-gray-4)" />
          <div className={`${css.linchip} ${css.linchipCur}`}>
            <div
              className={css.linchipDot}
              style={{ background: item.specimenIdentityHue != null ? identGrad(item.specimenIdentityHue) : coralIdentityGradient(item.specimenId) }}
            />
            {item.specimenRfCode && <span className={css.linchipCode}>{item.specimenRfCode}</span>}
            {!item.specimenRfCode && <span className={css.linchipCode}>{item.specimenName}</span>}
          </div>
        </div>
      )}

      {/* Foot */}
      <div className={css.postFoot}>
        <button className={css.reactBtn}>
          <IconHeart size={17} /> 0
        </button>
        <button className={css.reactBtn}>
          <IconMessageCircle size={17} /> 0
        </button>
        <button className={css.reactBtn}>
          <IconShare3 size={16} />
        </button>
      </div>
    </Paper>
  );
}

// ── Right rail ───────────────────────────────────────────────────────────────
const SUGGEST = [
  { who: 'Tidal Gardens', hue: 160, meta: 'Reef & Coral · frags shared' },
  { who: 'Pastel Pythons', hue: 140, meta: 'Reptiles · bloodlines' },
];

const TRENDING = [
  { tag: 'Acropora tortuosa', meta: 'Reef & Coral', n: '18 threads', hue: 140 },
  { tag: 'Bucephalandra', meta: 'Freshwater', n: '15 threads', hue: 150 },
  { tag: 'SPS frag tips', meta: 'Reef & Coral', n: '11 threads', hue: 200 },
];

function RightRail() {
  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group justify="space-between" align="center" mb={4}>
          <span className={css.eyebrow}>who to follow</span>
          <Text size="xs" fw={600} c="ocean.6" style={{ cursor: 'pointer' }}>See all</Text>
        </Group>
        {SUGGEST.map((s) => (
          <Group key={s.who} gap={10} py={9} style={{ borderTop: '1px solid var(--mantine-color-default-border)' }} wrap="nowrap">
            <Avatar size={36} radius="xl" style={{ background: identGrad(s.hue), color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              {s.who[0]}
            </Avatar>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>{s.who}</Text>
              <Text size="xs" c="dimmed" truncate>{s.meta}</Text>
            </Stack>
            <Button size="xs" variant="light" style={{ flexShrink: 0 }}>Follow</Button>
          </Group>
        ))}
      </Paper>

      <Paper withBorder p="md">
        <span className={css.eyebrow} style={{ marginBottom: 10 }}>trending in your communities</span>
        <Stack gap={8} mt={10}>
          {TRENDING.map((t) => (
            <Group key={t.tag} gap={10} wrap="nowrap">
              <Box
                style={{
                  width: 28, height: 28, borderRadius: 'var(--mantine-radius-md)', flexShrink: 0,
                  background: `oklch(0.96 0.03 ${t.hue})`,
                  color: fink(t.hue),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconTrendingUp size={14} />
              </Box>
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>{t.tag}</Text>
                <Text size="xs" c="dimmed">{t.meta}</Text>
              </Stack>
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{t.n}</Text>
            </Group>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p="md" style={{ background: 'var(--mantine-color-ocean-0)', borderColor: 'var(--mantine-color-ocean-1)' }}>
        <Group gap={8} mb={6}>
          <IconCake size={16} color="var(--mantine-color-ocean-7)" />
          <Text fw={600} size="sm" c="ocean.9">Coming up</Text>
        </Group>
        <Text size="xs" c="ocean.7">
          Share your first coral anniversary post when your collection turns a year old.
        </Text>
      </Paper>

      <Text size="xs" c="dimmed" px={4} style={{ lineHeight: 1.7 }}>
        About · Communities · Guidelines · Help<br />
        Polyp © 2026
      </Text>
    </Stack>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function FeedPage() {
  const items = await getFeedItems(30);

  const recent = items.slice(0, Math.ceil(items.length * 0.6));
  const earlier = items.slice(Math.ceil(items.length * 0.6));

  return (
    <Box maw={960} mx="auto">
      <Stack gap={4} mb="md">
        <Text style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: 24, lineHeight: 1.2 }}>
          Feed
        </Text>
        <Text size="sm" c="dimmed">From keepers and communities you follow</Text>
      </Stack>

      <Group align="flex-start" gap="lg" wrap="nowrap">
        {/* Main column */}
        <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
          <Composer />

          {/* Scope bar */}
          <div className={css.scopeBar}>
            <SegmentedControl
              size="xs"
              data={['Following', 'Your communities', 'For you']}
              defaultValue="Following"
            />
            <Box style={{ flex: 1 }} />
            <div className={css.commFilter}>
              <span className={`${css.commPill} ${css.commPillActive}`}>All</span>
              <span className={css.commPill}>
                <span className={css.commDot} style={{ background: identGrad(200) }} />
                Reef
              </span>
            </div>
          </div>

          {items.length === 0 && (
            <Paper withBorder p="xl">
              <Stack align="center" gap="sm">
                <IconSeeding size={32} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" size="sm" ta="center">
                  Your feed is empty. Follow some keepers or add corals to get started.
                </Text>
                <Link href="/explore">
                  <Button component="a" variant="light" size="sm">Explore keepers</Button>
                </Link>
              </Stack>
            </Paper>
          )}

          {recent.map((item) => (
            <PostCard key={item.id} item={item} />
          ))}

          {earlier.length > 0 && (
            <>
              <div className={css.dayDiv}>
                <div className={css.dayDivLine} />
                <span className={css.dayDivLabel}>Earlier</span>
                <div className={css.dayDivLine} />
              </div>
              {earlier.map((item) => (
                <PostCard key={item.id} item={item} />
              ))}
            </>
          )}

          {items.length > 0 && (
            <Group justify="center">
              <Button variant="default" size="sm">Load more</Button>
            </Group>
          )}
        </Stack>

        {/* Right rail */}
        <Box style={{ width: 280, flexShrink: 0 }} visibleFrom="lg">
          <RightRail />
        </Box>
      </Group>
    </Box>
  );
}
