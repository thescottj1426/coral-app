import { IconMessage, IconHelpCircle, IconTag, IconCircleCheck } from '@tabler/icons-react';
import type { ThreadType } from '@/app/actions/discussions';
import styles from './discussion.module.css';

const TYPE_CONFIG: Record<ThreadType, {
  label: string;
  bg: string;
  fg: string;
  Icon: React.ComponentType<{ size?: number; stroke?: number }>;
}> = {
  discussion: {
    label: 'Discussion',
    bg: 'var(--mantine-color-gray-1)',
    fg: 'var(--mantine-color-gray-7)',
    Icon: IconMessage,
  },
  question: {
    label: 'Question',
    bg: 'var(--mantine-color-yellow-0)',
    fg: 'var(--mantine-color-yellow-8)',
    Icon: IconHelpCircle,
  },
  health: {
    label: 'ID / Health',
    bg: 'var(--mantine-color-violet-0)',
    fg: 'var(--mantine-color-violet-7)',
    Icon: IconHelpCircle,
  },
  trade: {
    label: 'Trade talk',
    bg: 'var(--mantine-color-teal-0)',
    fg: 'var(--mantine-color-teal-7)',
    Icon: IconTag,
  },
};

interface TypeBadgeProps {
  type: ThreadType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const { label, bg, fg, Icon } = TYPE_CONFIG[type];
  return (
    <span
      className={styles.tbadge}
      style={{ background: bg, color: fg }}
    >
      <Icon size={12} stroke={2} /> {label}
    </span>
  );
}

export function ResolvedBadge() {
  return (
    <span
      className={styles.tbadge}
      style={{
        background: 'var(--mantine-color-teal-0)',
        color: 'var(--mantine-color-teal-7)',
      }}
    >
      <IconCircleCheck size={12} stroke={2} /> Resolved
    </span>
  );
}

export const THREAD_TYPES: { value: ThreadType; label: string }[] = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'question',   label: 'Question' },
  { value: 'health',     label: 'ID / Health' },
  { value: 'trade',      label: 'Trade talk' },
];
