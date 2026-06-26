import Link from 'next/link';
import {
  IconGitBranch, IconHexagon, IconMapPin, IconTag, IconTrendingUp, IconChevronRight,
} from '@tabler/icons-react';
import type { AnchorType } from '@/lib/anchorTypes';
import { ANCHOR_TYPE_CONFIG, anchorTile, anchorInk, anchorWash } from '@/lib/anchorTypes';
import styles from './discussion.module.css';

const ANCHOR_ICON: Partial<Record<AnchorType, React.ComponentType<{ size?: number; stroke?: number }>>> = {
  line:    IconGitBranch,
  species: IconHexagon,
  photo:   IconMapPin,
  listing: IconTag,
  log:     IconTrendingUp,
};

interface Props {
  anchorType?: AnchorType;
  name: string;
  code?: string | null;
  sub?: string | null;
  identityHue?: number | null;
  href?: string | null;
}

export function AnchorCard({
  anchorType = 'specimen',
  name,
  code,
  sub,
  identityHue,
  href,
}: Props) {
  const cfg = ANCHOR_TYPE_CONFIG[anchorType];
  const hue = anchorType === 'specimen' ? (identityHue ?? 200) : (cfg.hue ?? 200);
  const Icon = ANCHOR_ICON[anchorType];
  const ink = anchorInk(hue);

  return (
    <div
      className={styles.anchorCard}
      style={{ '--ac': ink } as React.CSSProperties}
    >
      {/* Tile */}
      {anchorType === 'specimen' ? (
        <span
          className={styles.anchorTile}
          style={{ background: anchorTile(hue) }}
        />
      ) : (
        <span
          className={styles.anchorTile}
          style={{ background: anchorWash(hue), color: ink }}
        >
          {Icon && <Icon size={20} stroke={1.8} />}
        </span>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={styles.anchorCardEyebrow}>Anchored to · {cfg.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{name}</span>
          {code && (
            <span style={{
              fontFamily: 'var(--font-ibm-plex-mono), monospace',
              fontSize: 12,
              background: 'var(--mantine-color-gray-1)',
              color: 'var(--mantine-color-gray-8)',
              padding: '1px 6px',
              borderRadius: 3,
            }}>
              {code}
            </span>
          )}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)', marginTop: 1 }}>{sub}</div>
        )}
      </div>

      {/* Open button */}
      {href && (
        <Link href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 30,
            padding: '0 12px',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            background: 'var(--mantine-color-body)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            color: 'inherit',
          }}>
            Open <IconChevronRight size={12} />
          </button>
        </Link>
      )}
    </div>
  );
}
