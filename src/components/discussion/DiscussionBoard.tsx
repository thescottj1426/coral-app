'use client';

import { useState } from 'react';
import { Box, Group, Text, Avatar, Button, SegmentedControl, Stack } from '@mantine/core';
import { IconPlus, IconMessageCircle } from '@tabler/icons-react';
import { ThreadRow } from './ThreadRow';
import { ThreadComposer } from './ThreadComposer';
import type { ThreadRow as ThreadRowType } from '@/app/actions/discussions';

const EYEBROW: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--mantine-color-dimmed)',
  fontWeight: 500,
};

type SortOrder = 'active' | 'newest' | 'unanswered';

interface Props {
  threads: ThreadRowType[];
  specimenId: string;
  specimenRfCode: string | null;
  specimenName: string;
  specimenIdentityHue?: number | null;
  isLoggedIn: boolean;
  authorInitial: string;
  authorHue: number;
}

export function DiscussionBoard({
  threads, specimenId, specimenRfCode, specimenName, specimenIdentityHue,
  isLoggedIn, authorInitial, authorHue,
}: Props) {
  const [sort, setSort] = useState<SortOrder>('active');
  const [composerOpen, setComposerOpen] = useState(false);

  const sorted = [...threads].sort((a, b) => {
    if (sort === 'newest')     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'unanswered') return a.replyCount - b.replyCount;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const avatarBg = `oklch(0.62 0.1 ${authorHue})`;

  return (
    <>
      {/* Inline composer entry — always visible; auth checked on submit */}
      <Box style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingBottom: 12, borderBottom: '1px solid var(--mantine-color-default-border)',
      }}>
        <Avatar
          size={32}
          radius="xl"
          style={{
            background: isLoggedIn ? avatarBg : 'var(--mantine-color-gray-3)',
            color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}
        >
          {isLoggedIn ? authorInitial : '?'}
        </Avatar>
        <Box
          onClick={() => setComposerOpen(true)}
          style={{
            flex: 1, height: 36, borderRadius: 6, cursor: 'text',
            background: 'var(--mantine-color-gray-0)',
            border: '1px solid var(--mantine-color-default-border)',
            display: 'flex', alignItems: 'center', padding: '0 12px',
          }}
        >
          <Text size="sm" c="dimmed">Start a thread about this coral…</Text>
        </Box>
        <Button size="xs" leftSection={<IconPlus size={13} />} onClick={() => setComposerOpen(true)}>
          New thread
        </Button>
      </Box>

      {/* Thread count + sort control */}
      <Group justify="space-between" align="center" py="xs">
        <Text style={EYEBROW}>
          {threads.length} {threads.length === 1 ? 'thread' : 'threads'} anchored here
        </Text>
        {threads.length > 1 && (
          <SegmentedControl
            size="xs"
            data={[
              { value: 'active',     label: 'Active' },
              { value: 'newest',     label: 'Newest' },
              { value: 'unanswered', label: 'Unanswered' },
            ]}
            value={sort}
            onChange={(v) => setSort(v as SortOrder)}
          />
        )}
      </Group>

      {/* Thread list */}
      {sorted.length === 0 ? (
        <Stack align="center" py={32} gap={8}>
          <IconMessageCircle size={28} color="var(--mantine-color-gray-3)" />
          <Text size="sm" c="dimmed">No threads yet.</Text>
          <Text size="xs" c="dimmed">
            Start a discussion, ask a care question, or post a trade inquiry.
          </Text>
        </Stack>
      ) : (
        <Stack gap={0} mt={4}>
          {sorted.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              specimenSlug={specimenRfCode ?? specimenId}
            />
          ))}
        </Stack>
      )}

      {/* Composer modal */}
      <ThreadComposer
        specimenId={specimenId}
        specimenRfCode={specimenRfCode}
        specimenName={specimenName}
        specimenIdentityHue={specimenIdentityHue}
        opened={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </>
  );
}
