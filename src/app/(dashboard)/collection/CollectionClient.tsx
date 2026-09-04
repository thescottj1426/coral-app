'use client';

import {
  Box,
  Group,
  Text,
  Button,
  SimpleGrid,
  Paper,
  Badge,
  Tabs,
  TextInput,
  Stack,
} from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CategoryBadge } from '@/components/specimen/CategoryBadge';
import { statusLabel, statusColor } from '@/lib/coralStage';
import { SpecimenThumb } from '@/components/specimen/SpecimenThumb';
import { AddSpecimenDrawer } from '@/components/specimen/AddSpecimenDrawer';
import { createSpecimen, type SpecimenRow, type CoralStage } from '@/app/actions/specimens';
import { ClaimWidget } from '@/components/dashboard/ClaimWidget';
import Image from 'next/image';
import styles from './collection.module.css';
import type { DashboardStats, MyListing } from '@/app/actions/dashboard';

function SpecimenCard({ specimen }: { specimen: SpecimenRow }) {
  const thumb = specimen.rfCode ?? specimen.id;
  // Removed corals are dimmed, never hidden — vanishing is what makes people
  // think the record was destroyed, which is the misconception this fixes.
  const removedLabel = statusLabel(specimen.status);
  return (
    <Link href={`/collection/${specimen.rfCode ?? specimen.id}`} className={styles.card}>
      <Paper withBorder style={{ overflow: 'hidden', opacity: removedLabel ? 0.55 : 1 }}>
        <div className={styles.photoWrap}>
          {specimen.coverPhotoUrl ? (
            <Image
              src={specimen.coverPhotoUrl}
              alt={specimen.name}
              fill
              style={{ objectFit: 'cover', transition: 'transform 250ms ease' }}
              className={styles.thumb}
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className={styles.thumb} style={{ width: '100%', height: '100%' }}>
              <SpecimenThumb rfCode={thumb} size={0} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            </div>
          )}
          {removedLabel && (
            <Box style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
              <Badge size="xs" color={statusColor(specimen.status)} variant="filled" radius="sm">
                {removedLabel}
              </Badge>
            </Box>
          )}
          {specimen.coverPhotoPending && (
            <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
              <Badge size="xs" color="yellow" variant="filled" radius="sm">Pending review</Badge>
            </Box>
          )}
          <div className={styles.overlay}>
            <Text size="md" fw={700} truncate style={{ color: '#fff', lineHeight: 1.3 }}>
              {specimen.name}
            </Text>
            <Group gap={4} mt={3} wrap="nowrap">
              {specimen.category && <CategoryBadge category={specimen.category} />}
              {specimen.rfCode && (
                <Text style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: 9, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                  {specimen.rfCode}
                </Text>
              )}
            </Group>
          </div>
        </div>
      </Paper>
    </Link>
  );
}

function KpiRow({ stats }: { stats: DashboardStats }) {
  const items = [
    { value: stats.coralCount, label: 'corals' },
    { value: stats.fragsProduced, label: 'frags given' },
    { value: stats.fragsReceived, label: 'frags received' },
  ];
  return (
    <Paper withBorder p="sm" mb="md">
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={0}>
        {items.map((item, i) => (
          <Box key={item.label}
            style={{
              textAlign: 'center', padding: '8px 0',
              borderRight: i < items.length - 1 ? '1px solid var(--mantine-color-default-border)' : undefined,
            }}>
            <Text style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, lineHeight: 1 }}>
              {item.value}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>{item.label}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Paper>
  );
}

function ListingsPanel({ listings }: { listings: MyListing[] }) {
  if (listings.length === 0) return null;
  return (
    <Paper withBorder p="md" mb="md">
      <Text size="xs" fw={500} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-ibm-plex-mono), monospace', marginBottom: 8 }}>
        your listings
      </Text>
      <Stack gap={0}>
        {listings.map((l, i) => {
          const bg = l.identityHue != null
            ? `linear-gradient(135deg, oklch(0.76 0.11 ${l.identityHue}), oklch(0.5 0.13 ${l.identityHue}))`
            : 'var(--mantine-color-ocean-3)';
          return (
            <Group key={l.id} gap="xs" py={8} wrap="nowrap"
              style={i > 0 ? { borderTop: '1px solid var(--mantine-color-default-border)' } : undefined}>
              <Box style={{ width: 26, height: 26, borderRadius: 5, flexShrink: 0, background: bg }} />
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600} truncate>{l.coralName}</Text>
                <Text size="xs" c="dimmed">{l.qty != null ? `${l.qty} available` : 'qty TBD'}</Text>
              </Stack>
              {l.price != null && <Text size="sm" fw={600}>${l.price}</Text>}
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
}

type Category = 'SPS' | 'LPS' | 'SOFTIE' | 'ZOA' | 'ANEMONE' | 'OTHER';

const TAB_CATEGORIES: Array<{ value: string; label: string; category?: Category }> = [
  { value: 'all',   label: 'All' },
  { value: 'sps',   label: 'SPS',  category: 'SPS' },
  { value: 'lps',   label: 'LPS',  category: 'LPS' },
  { value: 'zoa',   label: 'Zoa',  category: 'ZOA' },
  { value: 'other', label: 'Other' },
];

interface CollectionClientProps {
  specimens: SpecimenRow[];
  stats: DashboardStats;
  listings: MyListing[];
  firstName: string;
  specimenCap: number | null;
}

export function CollectionClient({ specimens, stats, listings, firstName, specimenCap }: CollectionClientProps) {
  const atCap = specimenCap !== null && specimens.length >= specimenCap;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleCreate(values: {
    name: string; species?: string; category: string;
    origin?: string; notes?: string; photoUrl?: string; photoKey?: string;
    tankName?: string; lightPar?: string; flowLevel?: string;
    stage?: string; sourceKind?: string; parentId?: string;
    sourceColony?: string; vendor?: string; generationFromMother?: string;
  }) {
    const { sourceKind, generationFromMother, parentId, ...rest } = values;
    const gen = generationFromMother?.trim() ? Number(generationFromMother) : undefined;
    const payload = {
      ...rest,
      stage: rest.stage as CoralStage | undefined,
      // An original has no parent and sits at generation 0 by definition.
      ...(sourceKind === 'original' ? { generationFromMother: 0 } : {}),
      ...(sourceKind === 'own'      ? { parentId } : {}),
      ...(sourceKind === 'outside' && Number.isFinite(gen) ? { generationFromMother: gen } : {}),
    };
    const res = await createSpecimen(payload);
    // Thrown client-side so the drawer's own catch surfaces the message —
    // server-action errors are redacted in production builds.
    if ('error' in res) throw new Error(res.error);
    setDrawerOpen(false);
    startTransition(() => router.refresh());
  }

  const filtered = specimens.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.species?.toLowerCase().includes(q) ||
      s.rfCode?.toLowerCase().includes(q)
    );
  });

  function tabSpecimens(tab: string) {
    const cat = TAB_CATEGORIES.find((t) => t.value === tab);
    if (!cat || tab === 'all') return filtered;
    if (tab === 'other') return filtered.filter((s) => !['SPS', 'LPS', 'ZOA'].includes(s.category ?? ''));
    return filtered.filter((s) => s.category === cat.category);
  }

  const GRID = { base: 2, sm: 3, md: 4 } as const;

  return (
    <Box p={{ base: 'sm', md: 'lg' }} maw={1200}>
      <AddSpecimenDrawer
        ownCorals={specimens.map(s => ({ id: s.id, name: s.name, rfCode: s.rfCode }))}
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text component="h1"
            style={{ fontSize: 22, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}>
            {firstName}&apos;s collection
          </Text>
          <Text size="sm" c={atCap ? 'orange' : 'dimmed'} mt={2}>
            {specimens.length}
            {specimenCap !== null && ` / ${specimenCap}`}
            {' '}specimen{specimens.length !== 1 ? 's' : ''}
            {atCap && ' · free limit reached'}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => setDrawerOpen(true)}
          disabled={atCap}
          title={atCap ? `Free collections are limited to ${specimenCap} specimens.` : undefined}
        >
          Add specimen
        </Button>
      </Group>

      {/* KPIs */}
      <KpiRow stats={stats} />

      {/* Top utility row: claim + listings */}
      <div className={styles.topRow}>
        <ClaimWidget />
        <ListingsPanel listings={listings} />
      </div>

      {/* Search */}
      <Group gap="sm" mb="md" wrap="nowrap">
        <TextInput
          placeholder="Search specimens…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 280 }}
        />
      </Group>

      {/* Tabs + grid */}
      <Tabs defaultValue="all">
        <Tabs.List>
          {TAB_CATEGORIES.map((t) => {
            const count = t.value === 'all' ? filtered.length : tabSpecimens(t.value).length;
            return (
              <Tabs.Tab key={t.value} value={t.value}
                rightSection={<Badge size="xs" variant="light">{count}</Badge>}>
                {t.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {TAB_CATEGORIES.map((t) => (
          <Tabs.Panel key={t.value} value={t.value} pt="md">
            {tabSpecimens(t.value).length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                {search ? 'No specimens match your search.' : 'Your chest is empty — add your first specimen.'}
              </Text>
            ) : (
              <SimpleGrid cols={GRID} spacing="sm">
                {tabSpecimens(t.value).map((s) => (
                  <SpecimenCard key={s.id} specimen={s} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>
    </Box>
  );
}
