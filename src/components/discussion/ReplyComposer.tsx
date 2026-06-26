'use client';

import { useState, useTransition } from 'react';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { createReply } from '@/app/actions/discussions';
import { coralIdentityGradient } from '@/theme/theme';

interface Props {
  threadId: string;
  specimenId: string;
  authorUsername: string;
}

export function ReplyComposer({ threadId, specimenId, authorUsername }: Props) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        await createReply({ threadId, specimenId, body: body.trim() });
        setBody('');
        notifications.show({ message: 'Reply posted', color: 'teal' });
      } catch {
        notifications.show({ message: 'Could not post reply', color: 'red' });
      }
    });
  }

  const initial = authorUsername[0]?.toUpperCase() ?? '?';

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        display: 'flex', gap: 10, marginTop: 14, paddingTop: 14,
        borderTop: '1px solid var(--mantine-color-default-border)',
        alignItems: 'flex-end',
      }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: coralIdentityGradient(authorUsername + '_av'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}>
          {initial}
        </div>

        {/* Fake-input that expands to a real textarea on focus */}
        <textarea
          placeholder="Add a reply…"
          value={body}
          onChange={e => setBody(e.currentTarget.value)}
          rows={2}
          style={{
            flex: 1, resize: 'vertical', minHeight: 40,
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 6, padding: '10px 12px',
            fontFamily: 'inherit', fontSize: 13.5,
            color: 'var(--mantine-color-text)',
            background: 'var(--mantine-color-body)',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={!body.trim() || isPending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid transparent',
            background: 'var(--mantine-primary-color-filled)',
            color: '#fff', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            opacity: !body.trim() || isPending ? 0.5 : 1,
          }}
        >
          <IconSend size={14} /> Reply
        </button>
      </div>
    </form>
  );
}
