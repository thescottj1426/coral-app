import Link from 'next/link';
import { IconMessageCircle, IconCircleCheck } from '@tabler/icons-react';
import type { ThreadRow as ThreadRowType } from '@/app/actions/discussions';
import { TypeBadge, ResolvedBadge } from './TypeBadge';
import { AnchorChip } from './AnchorChip';
import { coralIdentityGradient } from '@/theme/theme';
import styles from './discussion.module.css';

interface Props {
  thread: ThreadRowType;
  specimenSlug: string;
}

export function ThreadRow({ thread, specimenSlug }: Props) {
  const solved = thread.resolved;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(thread.updatedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  })();

  return (
    <Link
      href={`/collection/${specimenSlug}/discussion/${thread.id}`}
      className={styles.thread}
    >
      <div className={styles.threadInner}>
        {/* Reply count / resolved gutter */}
        <div className={solved ? `${styles.threadRep} ${styles.threadRepSolved}` : styles.threadRep}>
          {solved
            ? <IconCircleCheck size={18} stroke={1.9} />
            : <IconMessageCircle size={16} stroke={1.7} />}
          <b className={solved ? styles.threadRepCountSolved : styles.threadRepCount}>
            {thread.replyCount}
          </b>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {solved ? <ResolvedBadge /> : <TypeBadge type={thread.type} />}
            <span className={styles.threadTitle}>{thread.title}</span>
          </div>

          {/* Meta: anchor chip · author · time */}
          <div className={styles.threadMeta}>
            {thread.anchorName && (
              <AnchorChip
                anchorType="specimen"
                name={thread.anchorName}
                code={thread.anchorRfCode}
                identityHue={thread.anchorIdentityHue}
                linked={false}
              />
            )}
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: coralIdentityGradient(thread.authorUsername + '_av'),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {thread.authorUsername[0]?.toUpperCase()}
              </span>
              {thread.authorUsername}
            </span>
            <span>·</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
