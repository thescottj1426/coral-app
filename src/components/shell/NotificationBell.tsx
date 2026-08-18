'use client';

import { useEffect, useState } from 'react';
import { ActionIcon, Indicator, Menu, Stack, Text, Group, Button } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { getUnreadCount, getMyNotifications, markAllRead, type NotificationRow } from '@/app/actions/notifications';

const TYPE_LABEL: Record<string, string> = {
  LIKE: 'liked your coral',
  COMMENT: 'commented on your coral',
  FOLLOW: 'followed you',
  REPLY: 'replied to your thread',
  BEST_ANSWER: 'marked your reply as the best answer',
  FRAG_CLAIMED: 'claimed a frag from your coral',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    getUnreadCount().then(setCount).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(setCount).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleOpen(isOpen: boolean) {
    setOpened(isOpen);
    if (isOpen) {
      getMyNotifications().then(setItems).catch(() => {});
    }
  }

  function handleMarkAllRead() {
    markAllRead().then(() => {
      setCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }).catch(() => {});
  }

  return (
    <Menu shadow="md" width={320} position="bottom-end" opened={opened} onChange={handleOpen}>
      <Menu.Target>
        <Indicator disabled={count === 0} label={count > 9 ? '9+' : count} size={16} color="red" offset={4}>
          <ActionIcon variant="subtle" size={32} radius="xl" aria-label="Notifications">
            <IconBell size={18} stroke={1.7} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>
      <Menu.Dropdown>
        <Group justify="space-between" px={8} py={4}>
          <Text size="sm" fw={700}>Notifications</Text>
          {count > 0 && (
            <Button variant="subtle" size="compact-xs" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </Group>
        <Menu.Divider />
        {items.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">No notifications yet.</Text>
        ) : (
          <Stack gap={0}>
            {items.map((n) => (
              <div key={n.id} style={{ padding: '8px 12px', background: n.read ? undefined : 'var(--mantine-color-ocean-0)' }}>
                <Text size="sm">
                  <Text span fw={600}>{n.fromUsername ? `@${n.fromUsername}` : 'Someone'}</Text>
                  {' '}{TYPE_LABEL[n.type] ?? 'sent a notification'}
                </Text>
                <Text size="xs" c="dimmed">{timeAgo(n.createdAt)}</Text>
              </div>
            ))}
          </Stack>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
