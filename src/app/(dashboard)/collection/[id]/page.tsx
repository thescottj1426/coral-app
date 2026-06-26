import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  Box,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import Image from 'next/image';
import { getSpecimen } from '@/app/actions/specimens';
import { auth } from '@/lib/auth';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { DiscussionSection } from '@/components/discussion/DiscussionSection';
import { coralIdentityGradient } from '@/theme/theme';
import { MetaStripActions, LineageSidebar, HeroActions } from './SpecimenDetailClient';

export const dynamic = 'force-dynamic';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const specimen = await getSpecimen(id);
  if (!specimen) return { title: 'Not found — Polyp' };
  return {
    title: `${specimen.name} — Polyp`,
    description: specimen.notes ?? `A ${specimen.category ?? 'coral'} specimen by @${specimen.ownerUsername}`,
  };
}

export default async function SpecimenDetailPage({ params }: Props) {
  const { id } = await params;
  const [specimen, session] = await Promise.all([
    getSpecimen(id),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!specimen) notFound();

  const isOwner = session?.user?.id === specimen.ownerId;

  const coverPhoto = specimen.photos[0] ?? null;
  const coverIsPending = isOwner && coverPhoto?.status === 'pending';

  return (
    <Box maw={1100}>
      {/* Hero */}
      <Box style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        {coverPhoto ? (
          <>
            <Image
              src={coverPhoto.url}
              alt={specimen.name}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            {coverIsPending && (
              <Box style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                <Badge color="yellow" variant="filled" size="sm" radius="sm">Pending Review</Badge>
              </Box>
            )}
          </>
        ) : (
          <Box style={{ height: 220, background: coralIdentityGradient(specimen.rfCode ?? specimen.id) }} />
        )}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
          }}
        />
        <Group
          style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}
          justify="space-between"
          align="flex-end"
          wrap="nowrap"
        >
          <Stack gap={4}>
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
          <HeroActions specimen={specimen} isOwner={isOwner} />
        </Group>
      </Box>

      {/* Meta strip */}
      <Paper withBorder radius={0} px="xl" py="sm" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <Group gap="xl" wrap="nowrap">
          {specimen.rfCode && (
            <Stack gap={0}>
              <Text style={EYEBROW}>RF code</Text>
              <Text size="sm" fw={600} style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                {specimen.rfCode}
              </Text>
            </Stack>
          )}
          <Stack gap={0}>
            <Text style={EYEBROW}>added</Text>
            <Text size="sm" fw={600}>
              {new Date(specimen.acquiredDate ?? specimen.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </Stack>
          <Stack gap={0}>
            <Text style={EYEBROW}>collector</Text>
            <Text size="sm" fw={600}>@{specimen.ownerUsername}</Text>
          </Stack>
          <MetaStripActions specimen={specimen} isOwner={isOwner} />
        </Group>
      </Paper>

      {/* Main layout */}
      <Box p="lg">
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {/* Left */}
          <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
            {specimen.notes && (
              <Paper withBorder p="md">
                <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>keeper notes</Text>
                <Text size="sm" style={{ lineHeight: 1.65 }}>{specimen.notes}</Text>
              </Paper>
            )}

            {/* Photos (beyond cover) */}
            {specimen.photos.length > 1 && (
              <Paper withBorder p="md">
                <Text style={{ ...EYEBROW, display: 'block', marginBottom: 12 }}>photos</Text>
                <SimpleGrid cols={3} spacing="xs">
                  {specimen.photos.map((photo) => (
                    <Box
                      key={photo.id}
                      style={{ aspectRatio: '1', position: 'relative', borderRadius: 8, overflow: 'hidden' }}
                    >
                      <Image src={photo.url} alt={specimen.name} fill style={{ objectFit: 'cover' }} />
                      {isOwner && photo.status === 'pending' && (
                        <Box style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Badge color="yellow" variant="filled" size="xs" radius="sm">Pending Review</Badge>
                        </Box>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              </Paper>
            )}

            <Paper withBorder p="md">
              <DiscussionSection
                specimenId={specimen.id}
                specimenRfCode={specimen.rfCode}
                specimenName={specimen.name}
                specimenIdentityHue={specimen.identityHue}
              />
            </Paper>
          </Stack>

          {/* Right sidebar */}
          <Stack gap="md" style={{ width: 280, flexShrink: 0 }}>
            <LineageSidebar specimen={specimen} />

            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 10 }}>specimen info</Text>
              <Stack gap={8}>
                {specimen.rfCode && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">RF Code</Text>
                    <Text size="xs" fw={600} style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                      {specimen.rfCode}
                    </Text>
                  </Group>
                )}
                {specimen.category && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Category</Text>
                    <CategoryBadge category={specimen.category} />
                  </Group>
                )}
                {specimen.origin && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Origin</Text>
                    <Text size="xs" fw={600}>{specimen.origin}</Text>
                  </Group>
                )}
                {specimen.species && (
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Species</Text>
                    <Text size="xs" fw={600} style={{ fontStyle: 'italic' }}>{specimen.species}</Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Group>
      </Box>
    </Box>
  );
}
