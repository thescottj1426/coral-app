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
} from '@mantine/core';
import { getSpecimen } from '@/app/actions/specimens';
import { auth } from '@/lib/auth';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { DiscussionSection } from '@/components/discussion/DiscussionSection';
import { coralIdentityGradient } from '@/theme/theme';
import { MetaStripActions, LineageSidebar, HeroActions, HeroPhoto } from './SpecimenDetailClient';
import { RfCodeQr } from '@/components/specimen/RfCodeQr';
import { PhotoGrid } from '@/components/specimen/PhotoGrid';
import styles from './specimen.module.css';

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
  if (!specimen) return { title: 'Not found — Coral Chest' };
  return {
    title: `${specimen.name} — Coral Chest`,
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

  return (
    <Box maw={1100}>
      {/* Hero */}
      <Box style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
        {coverPhoto ? (
          <HeroPhoto photo={coverPhoto} specimenName={specimen.name} isOwner={isOwner} />
        ) : (
          <Box style={{ height: 220, background: coralIdentityGradient(specimen.rfCode ?? specimen.id) }} />
        )}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <Group
          style={{ position: 'absolute', bottom: 20, left: 24, right: 24, pointerEvents: 'none' }}
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
          <div style={{ pointerEvents: 'auto' }}>
            <HeroActions specimen={specimen} isOwner={isOwner} />
          </div>
        </Group>
      </Box>

      {/* Meta strip */}
      <Paper withBorder radius={0} px="xl" py="sm" style={{ borderLeft: 'none', borderRight: 'none' }}>
        <div className={styles.metaStrip}>
          {specimen.rfCode && (
            <Stack gap={0}>
              <Text style={EYEBROW}>RF code</Text>
              <Group gap={4} align="center">
                <Text size="sm" fw={600} style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                  {specimen.rfCode}
                </Text>
                <RfCodeQr rfCode={specimen.rfCode} />
              </Group>
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
        </div>
      </Paper>

      {/* Main layout */}
      <Box p="lg">
        <div className={styles.mainLayout}>
          {/* Left */}
          <Stack gap="md" className={styles.mainLeft}>
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
                <PhotoGrid photos={specimen.photos} specimenName={specimen.name} isOwner={isOwner} />
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
          <Stack gap="md" className={styles.sidebar}>
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
                    <Text size="xs" c="dimmed">Species=</Text>
                    <Text size="xs" fw={600} style={{ fontStyle: 'italic' }}>{specimen.species}</Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Stack>
        </div>
      </Box>
    </Box>
  );
}
