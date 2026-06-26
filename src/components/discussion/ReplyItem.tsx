'use client';

import { useState, useTransition } from 'react';
import { IconCircleCheck, IconHeart, IconCornerUpLeft } from '@tabler/icons-react';
import { markBestAnswer } from '@/app/actions/discussions';
import type { ReplyRow } from '@/app/actions/discussions';
import { coralIdentityGradient } from '@/theme/theme';
import styles from './discussion.module.css';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

interface Props {
  reply: ReplyRow;
  threadId: string;
  specimenId: string;
  isAuthor: boolean;
  threadResolved: boolean;
}

export function ReplyItem({ reply, threadId, specimenId, isAuthor, threadResolved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localBest, setLocalBest] = useState(reply.isBest);

  function handleMarkBest() {
    setLocalBest(true);
    startTransition(() => markBestAnswer({ replyId: reply.id, threadId, specimenId }));
  }

  const name = reply.authorDisplayName ?? reply.authorUsername;

  return (
    <div className={localBest ? styles.replyBest : styles.reply}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: coralIdentityGradient(reply.authorUsername + '_av'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 12, fontWeight: 700,
      }}>
        {name[0]?.toUpperCase() ?? '?'}
      </div>

      <div className={styles.rBody}>
        <div className={styles.rHead}>
          {localBest && (
            <span className={styles.bestTag}>
              <IconCircleCheck size={13} stroke={2} /> Best answer
            </span>
          )}
          <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
          <span style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
            · {timeAgo(reply.createdAt)}
          </span>
        </div>

        <p className={styles.rText}>{reply.body}</p>

        <div className={styles.rActs}>
          <span>
            <IconHeart size={13} /> {reply.likes}
          </span>
          <span>
            <IconCornerUpLeft size={13} /> Reply
          </span>
          {isAuthor && !threadResolved && !localBest && (
            <span
              style={{ color: 'var(--mantine-color-teal-7)', opacity: isPending ? 0.5 : 1 }}
              onClick={!isPending ? handleMarkBest : undefined}
            >
              <IconCircleCheck size={13} stroke={2.4} /> Mark best
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
