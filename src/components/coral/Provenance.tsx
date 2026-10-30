import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconRosetteDiscountCheck } from '@tabler/icons-react';
import type { Family, ProvenanceEntry } from '@/lib/provenance';
import styles from './provenance.module.css';

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function UserLink({ username }: { username: string | null }) {
  if (!username) return <span>someone</span>;
  return <a className={styles.link} href={`/users/${username}`}>@{username}</a>;
}

export function OriginLabel({ family }: { family: Family }) {
  const { root } = family;
  if (root.ownerVerified && root.ownerUsername) {
    return (
      <Badge
        variant="light"
        color="teal"
        radius="xl"
        leftSection={<IconRosetteDiscountCheck size={12} />}
        component="a"
        href={`/users/${root.ownerUsername}`}
        style={{ cursor: 'pointer' }}
      >
        Verified farm @{root.ownerUsername}
      </Badge>
    );
  }
  return (
    <Text size="xs" c="dimmed">
      Origin self-reported{root.ownerUsername ? <> by <UserLink username={root.ownerUsername} /></> : ''}
    </Text>
  );
}

function entryText(e: ProvenanceEntry) {
  switch (e.kind) {
    case 'added': return <>Added to the chest by <UserLink username={e.username} /></>;
    case 'cut': return <>Cut by <UserLink username={e.username} />{e.fromRfCode && <> from <a className={styles.link} href={`/coral/${e.fromRfCode}`}>{e.fromRfCode}</a></>}</>;
    case 'claimed': return <>Claimed by <UserLink username={e.username} /></>;
    case 'transferred': return <>Transferred to <UserLink username={e.username} /> with a transfer code</>;
    case 'acquired': return <>Acquired by <UserLink username={e.username} /></>;
    case 'sold': return <>Sold by <UserLink username={e.username} /></>;
    case 'gifted': return <>Given away by <UserLink username={e.username} /></>;
    case 'note': return <>{e.notes ?? 'Status changed'}</>;
  }
}

export function ProvenanceTimeline({ entries }: { entries: ProvenanceEntry[] }) {
  return (
    <Paper withBorder p="md" mb="md">
      <Text className={styles.eyebrow}>provenance</Text>
      <ol className={styles.timeline}>
        {entries.map((e, i) => (
          <li key={i} className={styles.step}>
            <span className={styles.dot} />
            <Text size="sm">{entryText(e)}</Text>
            <Text size="xs" c="dimmed">{dateLabel(e.date)}{e.kind !== 'note' && e.notes ? ` · ${e.notes}` : ''}</Text>
          </li>
        ))}
      </ol>
    </Paper>
  );
}

export function FamilySection({ family, coralId }: { family: Family; coralId: string }) {
  if (family.pieces < 2) return null;
  const { root, keepers } = family;
  const isRoot = root.id === coralId;

  return (
    <Paper withBorder p="md" mb="md">
      <Text className={styles.eyebrow}>family</Text>
      <Stack gap="xs">
        <Text size="sm">
          <strong>{keepers.length} keeper{keepers.length === 1 ? '' : 's'}</strong> own a piece of{' '}
          {isRoot ? 'this colony' : (
            <>the <a className={styles.link} href={`/coral/${root.rfCode ?? root.id}`}>{root.name}</a> colony</>
          )}
          {' '}· {family.pieces} living piece{family.pieces === 1 ? '' : 's'}
        </Text>
        <Group gap={6} wrap="wrap">
          {keepers.map((k) => (
            <a key={k.username} href={`/users/${k.username}`} className={styles.keeper}>
              @{k.username}{k.pieces > 1 && <span className={styles.count}>×{k.pieces}</span>}
            </a>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}
