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
} from '@mantine/core';
import {
  IconArrowRight,
  IconSeeding,
  IconCompass,
  IconMessageCircle,
} from '@tabler/icons-react';
import { coralIdentityGradient } from '@/theme/theme';
import { getFeedItems } from '@/app/actions/feed';
import type { FeedItem } from '@/app/actions/feed';
import css from './feed.module.css';

export const dynamic = 'force-dynamic';

function identGrad(hue: number) {
  return `linear-gradient(135deg, oklch(0.72 0.13 ${hue}), oklch(0.5 0.15 ${hue}))`;
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
            <Text className={css.embedPrice}>${item.listingPrice}</Text>
          ) : (
            <Button component="a" href={`/collection/${item.specimenId}`} size="xs" variant="default">View</Button>
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

    </Paper>
  );
}

// ── Right rail ───────────────────────────────────────────────────────────────
function RightRail() {
  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group gap={8} mb={10}>
          <IconCompass size={16} color="var(--mantine-color-ocean-6)" />
          <Text fw={600} size="sm">Discover keepers</Text>
        </Group>
        <Text size="xs" c="dimmed" mb={12} style={{ lineHeight: 1.6 }}>
          Find other reef keepers, browse public collections, and follow the ones you like.
        </Text>
        <Button component="a" href="/explore" variant="light" size="xs" fullWidth>Explore keepers</Button>
      </Paper>

      <Paper withBorder p="md">
        <Group gap={8} mb={10}>
          <IconMessageCircle size={16} color="var(--mantine-color-ocean-6)" />
          <Text fw={600} size="sm">Community discussions</Text>
        </Group>
        <Text size="xs" c="dimmed" mb={12} style={{ lineHeight: 1.6 }}>
          Ask questions, share tips, and talk frags with other hobbyists.
        </Text>
        <Button component="a" href="/discuss" variant="light" size="xs" fullWidth>Go to Discuss</Button>
      </Paper>

      <Text size="xs" c="dimmed" px={4} style={{ lineHeight: 1.7 }}>
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
        <Text size="sm" c="dimmed">From keepers you follow</Text>
      </Stack>

      <Group align="flex-start" gap="lg" wrap="nowrap">
        {/* Main column */}
        <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
          {items.length === 0 && (
            <Paper withBorder p="xl">
              <Stack align="center" gap="sm">
                <IconSeeding size={32} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" size="sm" ta="center">
                  Your feed is empty. Follow some keepers or add corals to get started.
                </Text>
                <Button component="a" href="/explore" variant="light" size="sm">Explore keepers</Button>
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

        </Stack>

        {/* Right rail */}
        <Box style={{ width: 280, flexShrink: 0 }} visibleFrom="lg">
          <RightRail />
        </Box>
      </Group>
    </Box>
  );
}
