'use client';

import { useState, useTransition } from 'react';
import { Box, Group, Text, Stack, SegmentedControl, Paper, Modal, TextInput, Textarea } from '@mantine/core';
import {
  IconGitBranch, IconHexagon, IconMapPin, IconTag, IconTrendingUp,
  IconSparkles, IconMessageCircle, IconPlus, IconSearch, IconPhoto,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ThreadRow } from './ThreadRow';
import { TypeBadge } from './TypeBadge';
import { AnchorCard } from './AnchorCard';
import { THREAD_TYPES } from './TypeBadge';
import type { ThreadRow as ThreadRowType } from '@/app/actions/discussions';
import type { SpecimenRow } from '@/app/actions/specimens';
import { ANCHOR_TYPE_CONFIG, anchorInk, anchorWash, anchorTile } from '@/lib/anchorTypes';
import type { AnchorType } from '@/lib/anchorTypes';
import { createThread } from '@/app/actions/discussions';
import type { ThreadType } from '@/app/actions/discussions';
import styles from './discussion.module.css';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

const ANCHOR_ICON: Partial<Record<AnchorType, React.ComponentType<{ size?: number; stroke?: number }>>> = {
  line:    IconGitBranch,
  species: IconHexagon,
  photo:   IconMapPin,
  listing: IconTag,
  log:     IconTrendingUp,
};

const ANCHOR_DESC: Record<AnchorType, string> = {
  specimen: 'A single animal you own — its page gets a Discussion tab.',
  line:     'A whole pedigree — talk that follows every frag.',
  species:  'A species or morph — where keepers across the world meet.',
  photo:    'A point on an image — perfect for ID & health checks.',
  listing:  'A marketplace listing — buyer questions stay attached.',
  log:      'A logged data point — discuss what happened and why.',
};

const ANCHOR_ORDER: AnchorType[] = ['specimen', 'line', 'species', 'photo', 'listing', 'log'];

type SortOrder = 'active' | 'newest' | 'unanswered';

interface Props {
  threads: ThreadRowType[];
  mySpecimens: SpecimenRow[];
  isLoggedIn: boolean;
}

export function DiscussHub({ threads, mySpecimens, isLoggedIn }: Props) {
  const [anchorFilter, setAnchorFilter] = useState<AnchorType | 'all'>('all');
  const [sort, setSort] = useState<SortOrder>('active');
  const [composerOpen, setComposerOpen] = useState(false);

  const counts = Object.fromEntries(
    ANCHOR_ORDER.map(t => [t, threads.filter(th => th.anchorType === t).length])
  ) as Record<AnchorType, number>;

  const filtered = [...threads]
    .filter(t => anchorFilter === 'all' || t.anchorType === anchorFilter)
    .sort((a, b) => {
      if (sort === 'newest')     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'unanswered') return a.replyCount - b.replyCount;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const trending = threads
    .filter(t => t.anchorName)
    .reduce<{ name: string; rfCode: string | null; anchorType: string; count: number }[]>((acc, t) => {
      const key = t.anchorRfCode ?? t.anchorId;
      const hit = acc.find(a => (a.rfCode ?? a.name) === key);
      if (hit) { hit.count++; }
      else { acc.push({ name: t.anchorName!, rfCode: t.anchorRfCode ?? null, anchorType: t.anchorType, count: 1 }); }
      return acc;
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <>
      {/* Page header */}
      <Group justify="space-between" align="flex-start" mb="xl">
        <Stack gap={2}>
          <Text component="h1" style={{ fontSize: 24, fontFamily: 'var(--font-sora)', fontWeight: 700, margin: 0 }}>
            Discussions
          </Text>
          <Text size="sm" c="dimmed">
            Every thread is pinned to a real object — browse by anchor type or start a new one.
          </Text>
        </Stack>
        <button
          onClick={() => setComposerOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 38, padding: '0 16px',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid transparent',
            background: 'var(--mantine-primary-color-filled)',
            color: '#fff', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <IconPlus size={15} stroke={2.2} /> New thread
        </button>
      </Group>

      <Box style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', gap: 20, alignItems: 'start' }}>

        {/* ── Left sidebar: anchor type rows ── */}
        <Stack gap={6}>
          <Text style={{ ...EYEBROW, display: 'block', marginBottom: 4 }}>Anchor type</Text>

          <AnchorTypeRow
            label="All threads"
            desc="Every anchored discussion"
            hue={null}
            isAll
            count={threads.length}
            active={anchorFilter === 'all'}
            onClick={() => setAnchorFilter('all')}
          />

          {ANCHOR_ORDER.map(type => {
            const cfg = ANCHOR_TYPE_CONFIG[type];
            const hue = type === 'specimen' ? 200 : (cfg.hue ?? 200);
            return (
              <AnchorTypeRow
                key={type}
                label={cfg.label}
                desc={ANCHOR_DESC[type]}
                hue={hue}
                isSpecimen={type === 'specimen'}
                Icon={ANCHOR_ICON[type]}
                count={counts[type]}
                active={anchorFilter === type}
                onClick={() => setAnchorFilter(anchorFilter === type ? 'all' : type)}
              />
            );
          })}
        </Stack>

        {/* ── Main column: thread list ── */}
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text style={EYEBROW}>
              {filtered.length} {filtered.length === 1 ? 'thread' : 'threads'}
              {anchorFilter !== 'all' && ` · ${ANCHOR_TYPE_CONFIG[anchorFilter].label}`}
            </Text>
            <SegmentedControl
              size="xs"
              data={[
                { value: 'active',     label: 'Active' },
                { value: 'newest',     label: 'Newest' },
                { value: 'unanswered', label: 'Unanswered' },
              ]}
              value={sort}
              onChange={v => setSort(v as SortOrder)}
            />
          </Group>

          <Paper withBorder>
            {filtered.length === 0 ? (
              <Stack align="center" py={40} gap={8}>
                <IconMessageCircle size={28} color="var(--mantine-color-gray-3)" />
                <Text size="sm" c="dimmed">
                  {anchorFilter === 'all'
                    ? 'No threads yet.'
                    : `No ${ANCHOR_TYPE_CONFIG[anchorFilter].label} threads yet.`}
                </Text>
                {anchorFilter === 'all' && (
                  <Text size="xs" c="dimmed">Start a new thread above, or open a coral in your collection.</Text>
                )}
              </Stack>
            ) : (
              <Box px="md" pb="md" pt="xs">
                {filtered.map(t => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    specimenSlug={t.anchorRfCode ?? t.anchorId}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Stack>

        {/* ── Right rail ── */}
        <Stack gap="md">
          {trending.length > 0 && (
            <Paper withBorder p="md">
              <Group gap={6} mb={10}>
                <IconSparkles size={13} color="var(--mantine-color-ocean-6)" />
                <Text style={EYEBROW}>most discussed</Text>
              </Group>
              <Stack gap={8}>
                {trending.map(a => {
                  const hue = a.anchorType === 'specimen'
                    ? 200
                    : (ANCHOR_TYPE_CONFIG[a.anchorType as AnchorType]?.hue ?? 200);
                  const Icon = ANCHOR_ICON[a.anchorType as AnchorType];
                  return (
                    <Link
                      key={a.rfCode ?? a.name}
                      href={a.rfCode ? `/collection/${a.rfCode}` : '/discuss'}
                      style={{ textDecoration: 'none' }}
                    >
                      <Group gap={8} wrap="nowrap">
                        <Box style={{
                          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                          background: a.anchorType === 'specimen' ? anchorTile(hue) : anchorWash(hue),
                          color: anchorInk(hue),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {a.anchorType !== 'specimen' && Icon && <Icon size={14} stroke={1.8} />}
                        </Box>
                        <Text size="sm" fw={600} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.name}
                        </Text>
                        <Text size="xs" c="dimmed">{a.count}</Text>
                      </Group>
                    </Link>
                  );
                })}
              </Stack>
            </Paper>
          )}

          {filtered.length > 0 && (
            <Paper withBorder p="md">
              <Text style={{ ...EYEBROW, display: 'block', marginBottom: 10 }}>by thread type</Text>
              <Stack gap={6}>
                {(['question', 'health', 'discussion', 'trade'] as const).map(type => {
                  const count = filtered.filter(t => t.type === type).length;
                  if (!count) return null;
                  return (
                    <Group key={type} justify="space-between">
                      <TypeBadge type={type} />
                      <Text size="xs" c="dimmed">{count}</Text>
                    </Group>
                  );
                })}
              </Stack>
            </Paper>
          )}

          <Paper withBorder p="md" style={{ background: 'var(--mantine-color-ocean-0)', borderColor: 'var(--mantine-color-ocean-2)' }}>
            <Text size="sm" fw={700} c="ocean.9" mb={6}>Anchored = answerable</Text>
            <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
              Every thread lives on a specific coral, bloodline, or species — so the right people see it and the answer stays with the object forever.
            </Text>
            <Link href="/collection" style={{ textDecoration: 'none', display: 'block', marginTop: 10 }}>
              <Box style={{
                display: 'block', textAlign: 'center', padding: '6px 12px',
                background: 'var(--mantine-color-ocean-1)', borderRadius: 6,
                color: 'var(--mantine-color-ocean-9)', fontSize: 12, fontWeight: 600,
              }}>
                Go to my collection →
              </Box>
            </Link>
          </Paper>
        </Stack>
      </Box>

      {/* New thread composer modal */}
      <NewThreadModal
        opened={composerOpen}
        onClose={() => setComposerOpen(false)}
        mySpecimens={mySpecimens}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}

// ── Anchor type row atom ─────────────────────────────────────────
function AnchorTypeRow({
  label, desc, hue, isAll, isSpecimen, Icon, count, active, onClick,
}: {
  label: string;
  desc: string;
  hue: number | null;
  isAll?: boolean;
  isSpecimen?: boolean;
  Icon?: React.ComponentType<{ size?: number; stroke?: number }>;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const h = hue ?? 200;
  const ink = anchorInk(h);
  const wash = anchorWash(h);

  const icBoxStyle: React.CSSProperties = isAll
    ? { background: active ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-gray-1)', color: active ? '#fff' : 'var(--mantine-color-dimmed)' }
    : isSpecimen
    ? { background: anchorTile(h) }
    : { background: wash, color: ink };

  return (
    <button
      onClick={onClick}
      className={`${styles.atypeOpt} ${active ? styles.atypeOptActive : ''}`}
      style={active && !isAll ? { '--ac-ink': ink, '--ac-wash': wash } as React.CSSProperties : undefined}
    >
      <span className={styles.atypeIcBox} style={icBoxStyle}>
        {isAll ? <IconMessageCircle size={17} stroke={1.8} /> : isSpecimen ? null : Icon ? <Icon size={17} stroke={1.8} /> : null}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, lineHeight: 1.25, color: active && !isAll ? ink : 'var(--mantine-color-gray-9)' }}>
          {label}
        </span>
        <span style={{ display: 'block', color: 'var(--mantine-color-dimmed)', fontSize: 11.5, marginTop: 3, lineHeight: 1.4 }}>
          {desc}
        </span>
      </span>
      <span
        className={`${styles.atypeCount} ${active ? styles.atypeCountActive : ''}`}
        style={active && !isAll ? { background: ink } as React.CSSProperties : undefined}
      >
        {count}
      </span>
    </button>
  );
}

// ── Inline photo upload widget ───────────────────────────────────
function PhotoUpload({
  photoKey, onUpload, label = 'Attach photo', required = false,
}: {
  photoKey: string | null;
  onUpload: (key: string | null) => void;
  label?: string;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { key } = await res.json();
      onUpload(key);
    } catch {
      notifications.show({ message: 'Upload failed', color: 'red' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {!required && (
        <Text style={{ ...EYEBROW, display: 'block', marginBottom: 6 }}>{label}</Text>
      )}
      {photoKey ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image?key=${photoKey}`}
            alt="Attached"
            style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, display: 'block' }}
          />
          <button
            type="button"
            onClick={() => onUpload(null)}
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              border: 'none', borderRadius: 4, padding: '2px 8px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, minHeight: required ? 120 : 72,
          border: `1px dashed var(--mantine-color-default-border)`,
          borderRadius: 'var(--mantine-radius-md)',
          cursor: uploading ? 'wait' : 'pointer',
          background: 'var(--mantine-color-gray-0)',
          transition: 'border-color 0.15s',
        }}>
          <IconPhoto size={22} color="var(--mantine-color-dimmed)" stroke={1.5} />
          <Text size="xs" c="dimmed">{uploading ? 'Uploading…' : required ? 'Upload a photo (required)' : 'Click to attach a photo'}</Text>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      )}
    </div>
  );
}

// ── New thread modal: step 1 pick anchor type, step 2 pick object + write ──
function NewThreadModal({
  opened, onClose, mySpecimens, isLoggedIn,
}: {
  opened: boolean;
  onClose: () => void;
  mySpecimens: SpecimenRow[];
  isLoggedIn: boolean;
}) {
  const [anchorType, setAnchorType] = useState<AnchorType | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSpecimen, setSelectedSpecimen] = useState<SpecimenRow | null>(null);
  const [freeText, setFreeText] = useState('');   // for species/line/listing/log/photo description
  const [photoKey, setPhotoKey] = useState<string | null>(null);  // for photo anchor + optional attachment
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [threadType, setThreadType] = useState<ThreadType>('question');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClose() {
    setAnchorType(null); setSearch(''); setSelectedSpecimen(null);
    setFreeText(''); setPhotoKey(null); setTitle(''); setBody('');
    onClose();
  }

  function resetAnchor() {
    setSelectedSpecimen(null); setFreeText(''); setPhotoKey(null); setSearch('');
  }

  // For photo anchor: need both an uploaded image AND a description
  const anchorResolved = anchorType !== null && (
    anchorType === 'specimen' ? selectedSpecimen !== null :
    anchorType === 'photo'   ? (photoKey !== null && freeText.trim().length > 0) :
    freeText.trim().length > 0
  );

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!anchorType || !anchorResolved || !title.trim()) return;

    const anchorId = anchorType === 'specimen'
      ? selectedSpecimen!.id
      : freeText.trim();

    startTransition(async () => {
      try {
        const thread = await createThread({
          anchorType,
          anchorId,
          specimenRfCode: anchorType === 'specimen' ? (selectedSpecimen!.rfCode ?? selectedSpecimen!.id) : undefined,
          title: title.trim(),
          body: body.trim() || null,
          type: threadType,
          photoKey: photoKey ?? null,
        });
        notifications.show({ message: 'Thread started', color: 'teal' });
        handleClose();
        if (anchorType === 'specimen' && selectedSpecimen) {
          router.push(`/collection/${selectedSpecimen.rfCode ?? selectedSpecimen.id}/discussion/${thread.id}`);
        } else {
          router.push('/discuss');
        }
      } catch {
        notifications.show({ message: 'Could not post thread', color: 'red' });
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <Modal opened={opened} onClose={onClose} title="New thread" centered size="sm">
        <Text size="sm" c="dimmed" ta="center" py="lg">
          <Link href="/sign-in" style={{ color: 'var(--mantine-primary-color-filled)' }}>Sign in</Link>
          {' '}to start a thread.
        </Text>
      </Modal>
    );
  }

  const filteredSpecimens = mySpecimens.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rfCode ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="md">New thread</Text>}
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">

          {/* ── Step 1: Pick anchor type ── */}
          <div>
            <Text style={{ ...EYEBROW, display: 'block', marginBottom: 8 }}>
              Anchor — what is this about?
            </Text>

            {anchorType === null ? (
              <Stack gap={6}>
                {ANCHOR_ORDER.map(type => {
                  const cfg = ANCHOR_TYPE_CONFIG[type];
                  const hue = type === 'specimen' ? 200 : (cfg.hue ?? 200);
                  const ink = anchorInk(hue);
                  const wash = anchorWash(hue);
                  const Icon = ANCHOR_ICON[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnchorType(type)}
                      className={styles.atypeOpt}
                    >
                      <span className={styles.atypeIcBox} style={
                        type === 'specimen'
                          ? { background: anchorTile(hue) }
                          : { background: wash, color: ink }
                      }>
                        {type !== 'specimen' && Icon && <Icon size={17} stroke={1.8} />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, lineHeight: 1.25 }}>{cfg.label}</span>
                        <span style={{ display: 'block', color: 'var(--mantine-color-dimmed)', fontSize: 11.5, marginTop: 3, lineHeight: 1.4 }}>
                          {ANCHOR_DESC[type]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </Stack>
            ) : (
              /* Anchor type chosen — show resolved card or input */
              <div>
                {anchorResolved ? (
                  /* Object selected — show AnchorCard + photo preview for photo type */
                  <div>
                    {anchorType === 'photo' && photoKey && (
                      <div style={{ marginBottom: 8 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/image?key=${photoKey}`}
                          alt="Anchor photo"
                          style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }}
                        />
                      </div>
                    )}
                    <AnchorCard
                      anchorType={anchorType}
                      name={anchorType === 'specimen' ? selectedSpecimen!.name : freeText.trim()}
                      code={anchorType === 'specimen' ? selectedSpecimen!.rfCode : null}
                      identityHue={anchorType === 'specimen' ? selectedSpecimen!.identityHue : null}
                    />
                    <button
                      type="button"
                      onClick={resetAnchor}
                      style={{
                        marginTop: 6, background: 'none', border: 'none',
                        color: 'var(--mantine-color-dimmed)', fontSize: 12,
                        cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                      }}
                    >
                      ← Change
                    </button>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => { setAnchorType(null); resetAnchor(); }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--mantine-color-dimmed)', fontSize: 12,
                        cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                      }}
                    >
                      Change type
                    </button>
                  </div>
                ) : anchorType === 'specimen' ? (
                  /* Specimen picker */
                  <div>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <IconSearch size={14} style={{
                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--mantine-color-dimmed)', pointerEvents: 'none',
                      }} />
                      <input
                        placeholder="Search your corals…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%', height: 36, paddingLeft: 32, paddingRight: 12,
                          border: '1px solid var(--mantine-color-default-border)',
                          borderRadius: 'var(--mantine-radius-md)',
                          fontFamily: 'inherit', fontSize: 13,
                          background: 'var(--mantine-color-body)',
                          color: 'var(--mantine-color-text)', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {mySpecimens.length === 0 ? (
                      <Text size="sm" c="dimmed" ta="center" py="sm">
                        No corals yet.{' '}
                        <Link href="/collection/add" style={{ color: 'var(--mantine-primary-color-filled)' }}>Add one →</Link>
                      </Text>
                    ) : (
                      <div style={{
                        maxHeight: 220, overflowY: 'auto',
                        border: '1px solid var(--mantine-color-default-border)',
                        borderRadius: 'var(--mantine-radius-md)',
                      }}>
                        {filteredSpecimens.length === 0
                          ? <Text size="sm" c="dimmed" ta="center" py="md">No corals match</Text>
                          : filteredSpecimens.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSpecimen(s)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '9px 12px',
                                background: 'none', border: 'none',
                                borderBottom: '1px solid var(--mantine-color-default-border)',
                                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                              }}
                            >
                              <span style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: anchorTile(s.identityHue ?? 200) }} />
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', lineHeight: 1.3 }}>{s.name}</span>
                                {s.rfCode && (
                                  <span style={{ fontSize: 11, color: 'var(--mantine-color-dimmed)', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                                    {s.rfCode}
                                  </span>
                                )}
                              </span>
                            </button>
                          ))
                        }
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setAnchorType(null)}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--mantine-color-dimmed)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      ← Back
                    </button>
                  </div>
                ) : anchorType === 'photo' ? (
                  /* Photo anchor: upload + description */
                  <div>
                    <PhotoUpload photoKey={photoKey} onUpload={setPhotoKey} required />
                    {photoKey && (
                      <input
                        placeholder="e.g. My hammer head — top-down, Jun 26"
                        value={freeText}
                        onChange={e => setFreeText(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%', height: 36, padding: '0 12px', marginTop: 8,
                          border: '1px solid var(--mantine-color-default-border)',
                          borderRadius: 'var(--mantine-radius-md)',
                          fontFamily: 'inherit', fontSize: 13,
                          background: 'var(--mantine-color-body)',
                          color: 'var(--mantine-color-text)', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setAnchorType(null)}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--mantine-color-dimmed)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      ← Back
                    </button>
                  </div>
                ) : (
                  /* Free-text anchor (species, bloodline, listing, log) */
                  <div>
                    <input
                      placeholder={
                        anchorType === 'species'  ? 'e.g. Acropora tortuosa' :
                        anchorType === 'line'     ? 'e.g. Reef Raft Oregon Tort line' :
                        anchorType === 'listing'  ? 'Listing name or item' :
                        anchorType === 'log'      ? 'e.g. Alk spike · Jun 10' :
                                                    'Description'
                      }
                      value={freeText}
                      onChange={e => setFreeText(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%', height: 36, padding: '0 12px',
                        border: '1px solid var(--mantine-color-default-border)',
                        borderRadius: 'var(--mantine-radius-md)',
                        fontFamily: 'inherit', fontSize: 13,
                        background: 'var(--mantine-color-body)',
                        color: 'var(--mantine-color-text)', outline: 'none',
                        boxSizing: 'border-box', marginBottom: 6,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setAnchorType(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--mantine-color-dimmed)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Step 2: Thread fields (only once anchor resolved) ── */}
          {anchorResolved && (
            <>
              <div>
                <Text size="sm" fw={500} mb={6}>Thread type</Text>
                <SegmentedControl
                  fullWidth size="xs"
                  data={THREAD_TYPES.map(t => ({ value: t.value, label: t.label }))}
                  value={threadType}
                  onChange={v => setThreadType(v as ThreadType)}
                />
              </div>

              <TextInput
                label="Title"
                placeholder="What's your question or topic?"
                value={title}
                onChange={e => setTitle(e.currentTarget.value)}
                autoFocus
                required
              />

              <Textarea
                label="Details"
                placeholder="Describe what you're seeing…"
                value={body}
                onChange={e => setBody(e.currentTarget.value)}
                autosize
                minRows={3}
              />

              {/* Optional photo for non-photo anchor types */}
              {anchorType !== 'photo' && (
                <PhotoUpload photoKey={photoKey} onUpload={setPhotoKey} label="Attach a photo (optional)" />
              )}

              <Group justify="flex-end" gap="sm" pt={4}>
                <button type="button" onClick={handleClose} disabled={isPending}
                  style={{
                    height: 36, padding: '0 16px',
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    background: 'var(--mantine-color-body)',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', color: 'var(--mantine-color-gray-7)',
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={!title.trim() || isPending}
                  style={{
                    height: 36, padding: '0 16px',
                    border: '1px solid transparent',
                    borderRadius: 'var(--mantine-radius-md)',
                    background: 'var(--mantine-primary-color-filled)',
                    color: '#fff', fontFamily: 'inherit',
                    fontSize: 14, fontWeight: 600,
                    cursor: !title.trim() || isPending ? 'not-allowed' : 'pointer',
                    opacity: !title.trim() || isPending ? 0.5 : 1,
                  }}>
                  {isPending ? 'Posting…' : 'Post thread'}
                </button>
              </Group>
            </>
          )}

        </Stack>
      </form>
    </Modal>
  );
}
