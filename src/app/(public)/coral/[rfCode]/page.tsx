import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Box, Stack, Text, Badge, Paper, Group, SimpleGrid } from '@mantine/core';
import { getPublicSpecimen, getMoreByOwner } from '@/app/actions/specimens';
import { getLineage, getChildren } from '@/app/actions/lineage';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { coralIdentityGradient } from '@/theme/theme';
import { CtaBanner } from '@/components/coral/CtaBanner';
import type { LineageNode } from '@/app/actions/lineage';
import type { PublicSpecimenStub } from '@/app/actions/specimens';

export const revalidate = 60;

interface Props {
  params: Promise<{ rfCode: string }>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rfCode } = await params;
  const specimen = await getPublicSpecimen(rfCode);
  if (!specimen) return { title: 'Not found — Coral Chest' };

  const description = specimen.notes
    ?? `${specimen.category ?? 'Coral'} · @${specimen.ownerUsername} · RF ${specimen.rfCode}`;
  const ogImage = specimen.photos[0]
    ? `${APP_URL}${specimen.photos[0].url}`
    : undefined;

  return {
    title: `${specimen.name} — Coral Chest`,
    description,
    openGraph: {
      title: `${specimen.name} — Coral Chest`,
      description,
      url: `${APP_URL}/coral/${specimen.rfCode}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: specimen.name }] : [],
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  };
}

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

function LineagePill({ node, dim }: { node: LineageNode; dim?: boolean }) {
  const href = node.rfCode ? `/coral/${node.rfCode}` : null;
  const bg = node.identityHue != null
    ? `oklch(0.72 0.10 ${node.identityHue})`
    : `var(--mantine-color-gray-3)`;

  const inner = (
    <Group gap={6} wrap="nowrap" style={{ opacity: dim ? 0.6 : 1 }}>
      <Box style={{ width: 10, height: 10, borderRadius: '50%', background: bg, flexShrink: 0 }} />
      <Stack gap={0}>
        <Text size="xs" fw={600} style={{ lineHeight: 1.2 }}>{node.name}</Text>
        <Text size="xs" c="dimmed">{node.ownerUsername ? `@${node.ownerUsername}` : 'Unclaimed'}</Text>
      </Stack>
    </Group>
  );

  if (!href) return <Box style={pillStyle}>{inner}</Box>;
  return (
    <Box component="a" href={href} style={{ ...pillStyle, textDecoration: 'none', color: 'inherit' }}>
      {inner}
    </Box>
  );
}

const pillStyle: React.CSSProperties = {
  border: '1px solid var(--mantine-color-default-border)',
  borderRadius: 'var(--mantine-radius-sm)',
  padding: '6px 10px',
  background: 'var(--mantine-color-body)',
  display: 'inline-flex',
  alignItems: 'center',
};

function CoralStubCard({ c }: { c: PublicSpecimenStub }) {
  const href = `/coral/${c.rfCode ?? c.id}`;
  const bg = c.identityHue != null
    ? `linear-gradient(135deg, oklch(0.76 0.11 ${c.identityHue}), oklch(0.5 0.13 ${c.identityHue}))`
    : coralIdentityGradient(c.id);

  return (
    <Box
      component="a"
      href={href}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <Paper withBorder style={{ overflow: 'hidden' }}>
        <Box style={{ height: 100, position: 'relative', overflow: 'hidden' }}>
          {c.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.coverPhotoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box style={{ height: '100%', background: bg }} />
          )}
        </Box>
        <Box p="xs">
          <Text size="xs" fw={700} truncate>{c.name}</Text>
          {c.category && (
            <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>{c.category}</Text>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default async function PublicCoralPage({ params }: Props) {
  const { rfCode } = await params;
  const specimen = await getPublicSpecimen(rfCode);
  if (!specimen) notFound();

  const [ancestors, children, more] = await Promise.all([
    getLineage(specimen.id),
    getChildren(specimen.id),
    getMoreByOwner(specimen.ownerId, specimen.id, 4),
  ]);

  const coverPhoto = specimen.photos[0] ?? null;

  return (
    <Box maw={900} mx="auto" py="lg" px="md">
      <CtaBanner />

      {/* Hero */}
      <Box style={{ height: 260, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', position: 'relative', marginBottom: 16 }}>
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto.url}
            alt={specimen.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box style={{ height: '100%', background: coralIdentityGradient(specimen.rfCode ?? specimen.id) }} />
        )}
        <Box style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)',
        }} />
        <Stack gap={4} style={{ position: 'absolute', bottom: 20, left: 20 }}>
          <Group gap={8}>
            {specimen.category && <CategoryBadge category={specimen.category} />}
            {specimen.origin && (
              <Badge variant="filled" size="sm" radius="xl"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', color: '#fff' }}
              >
                {specimen.origin}
              </Badge>
            )}
          </Group>
          <Text
            component="h1"
            style={{ fontSize: 28, fontFamily: 'var(--font-sora)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}
          >
            {specimen.name}
          </Text>
          {specimen.species && (
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontStyle: 'italic' }}>
              {specimen.species}
            </Text>
          )}
        </Stack>
      </Box>

      {/* Meta row */}
      <Paper withBorder p="md" mb="md">
        <Group gap="xl">
          {specimen.rfCode && (
            <Stack gap={0}>
              <Text style={EYEBROW}>RF code</Text>
              <Text size="sm" fw={600} style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                {specimen.rfCode}
              </Text>
            </Stack>
          )}
          <Stack gap={0}>
            <Text style={EYEBROW}>collector</Text>
            <Text
              component="a"
              href={`/users/${specimen.ownerUsername}`}
              size="sm" fw={600}
              style={{ color: 'var(--mantine-primary-color-filled)', textDecoration: 'none' }}
            >
              @{specimen.ownerUsername}
            </Text>
          </Stack>
          {specimen.acquiredDate && (
            <Stack gap={0}>
              <Text style={EYEBROW}>acquired</Text>
              <Text size="sm" fw={600}>
                {new Date(specimen.acquiredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </Stack>
          )}
        </Group>
      </Paper>

      {/* Notes */}
      {specimen.notes && (
        <Paper withBorder p="md" mb="md">
          <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>keeper notes</Text>
          <Text size="sm" style={{ lineHeight: 1.65 }}>{specimen.notes}</Text>
        </Paper>
      )}

      {/* Lineage */}
      {(ancestors.length > 0 || children.length > 0) && (
        <Paper withBorder p="md" mb="md">
          <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>lineage</Text>

          {ancestors.length > 0 && (
            <Box mb={children.length > 0 ? 'sm' : 0}>
              <Text size="xs" c="dimmed" mb={8}>ancestry</Text>
              <Group gap={6} align="center" wrap="wrap">
                {ancestors.map((a, i) => (
                  <Group key={a.id} gap={6} wrap="nowrap">
                    <LineagePill node={a} dim={i < ancestors.length - 1} />
                    <Text size="xs" c="dimmed">→</Text>
                  </Group>
                ))}
                <Box style={{ ...pillStyle, background: 'var(--mantine-color-ocean-0)', borderColor: 'var(--mantine-color-ocean-3)' }}>
                  <Group gap={6}>
                    <Box style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: specimen.identityHue != null ? `oklch(0.72 0.10 ${specimen.identityHue})` : 'var(--mantine-color-ocean-4)',
                    }} />
                    <Text size="xs" fw={700} c="ocean.7">{specimen.name}</Text>
                  </Group>
                </Box>
              </Group>
            </Box>
          )}

          {children.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" mb={8}>frags given out · {children.length}</Text>
              <Group gap={6} wrap="wrap">
                {children.map((c) => (
                  <LineagePill key={c.id} node={c} />
                ))}
              </Group>
            </Box>
          )}
        </Paper>
      )}

      {/* Additional photos */}
      {specimen.photos.length > 1 && (
        <Paper withBorder p="md" mb="md">
          <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>photos</Text>
          <Group gap="sm" wrap="wrap">
            {specimen.photos.slice(1).map((photo) => (
              <Box key={photo.id} style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={specimen.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Group>
        </Paper>
      )}

      {/* More from collector */}
      {more.length > 0 && (
        <Paper withBorder p="md">
          <Group justify="space-between" align="center" mb={12}>
            <Text style={EYEBROW}>more from @{specimen.ownerUsername}</Text>
            <Text
              component="a"
              href={`/users/${specimen.ownerUsername}`}
              size="xs" fw={600}
              style={{ color: 'var(--mantine-primary-color-filled)', textDecoration: 'none' }}
            >
              View profile →
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {more.map((c) => (
              <CoralStubCard key={c.id} c={c} />
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Box>
  );
}
