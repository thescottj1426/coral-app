'use client';

import { useState } from 'react';
import { Text, Group, Stack, Avatar, Textarea, Button, ActionIcon } from '@mantine/core';
import { IconThumbUp, IconMessageCircle } from '@tabler/icons-react';
import styles from './coral.module.css';

interface Comment {
  id: string;
  author: string;
  avatarHue: number;
  body: string;
  time: string;
  likes: number;
}

const STUB_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Nick Tran',
    avatarHue: 270,
    body: 'Got this frag three months ago — it\'s coloring up beautifully under my T5. Seeing purple tips under actinic.',
    time: '2d',
    likes: 4,
  },
  {
    id: '2',
    author: 'Reef Raft MN',
    avatarHue: 210,
    body: 'Classic Oregon Tort — give it high flow and it\'ll reward you. Mine is the mother colony at Gen 0.',
    time: '5d',
    likes: 11,
  },
];

function avatarBg(hue: number) {
  return `oklch(0.62 0.1 ${hue})`;
}

export function CommentSection() {
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState(STUB_COMMENTS);

  function submit() {
    if (!draft.trim()) return;
    setComments((prev) => [
      {
        id: String(Date.now()),
        author: 'Maya Okafor',
        avatarHue: 160,
        body: draft.trim(),
        time: 'just now',
        likes: 0,
      },
      ...prev,
    ]);
    setDraft('');
  }

  return (
    <Stack gap={0}>
      {/* Compose */}
      <Group gap={10} align="flex-start" mb="xs">
        <Avatar size={32} radius="xl" style={{ background: avatarBg(160), flexShrink: 0 }}>
          M
        </Avatar>
        <Stack gap={6} style={{ flex: 1 }}>
          <Textarea
            placeholder="Add a comment…"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            autosize
            minRows={2}
            styles={{ input: { fontSize: 14 } }}
          />
          <Group justify="flex-end">
            <Button size="xs" disabled={!draft.trim()} onClick={submit}>
              Post
            </Button>
          </Group>
        </Stack>
      </Group>

      {/* Thread */}
      {comments.map((c) => (
        <div key={c.id} className={styles.comment}>
          <Avatar size={32} radius="xl" style={{ background: avatarBg(c.avatarHue), flexShrink: 0 }}>
            {c.author[0]}
          </Avatar>
          <div className={styles.commentBody}>
            <Group gap={6} mb={2}>
              <Text size="sm" fw={600}>{c.author}</Text>
              <Text size="xs" c="dimmed">{c.time}</Text>
            </Group>
            <Text size="sm" style={{ lineHeight: 1.5 }}>{c.body}</Text>
            <div className={styles.commentActions}>
              <ActionIcon variant="subtle" size="xs" color="gray">
                <IconThumbUp size={13} />
              </ActionIcon>
              <Text size="xs" c="dimmed">{c.likes}</Text>
              <ActionIcon variant="subtle" size="xs" color="gray">
                <IconMessageCircle size={13} />
              </ActionIcon>
              <Text size="xs" c="dimmed">Reply</Text>
            </div>
          </div>
        </div>
      ))}
    </Stack>
  );
}
