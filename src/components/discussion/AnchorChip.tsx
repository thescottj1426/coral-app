import Link from 'next/link';
import {
  IconGitBranch, IconHexagon, IconMapPin, IconTag, IconTrendingUp,
} from '@tabler/icons-react';
import type { AnchorType } from '@/lib/anchorTypes';
import { ANCHOR_TYPE_CONFIG, anchorTile, anchorInk } from '@/lib/anchorTypes';
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
  identityHue?: number | null;
  href?: string | null;
  linked?: boolean;
}

export function AnchorChip({
  anchorType = 'specimen',
  name,
  code,
  identityHue,
  href,
  linked = true,
}: Props) {
  const cfg = ANCHOR_TYPE_CONFIG[anchorType];
  const hue = anchorType === 'specimen' ? (identityHue ?? 200) : (cfg.hue ?? 200);
  const Icon = ANCHOR_ICON[anchorType];

  const chip = (
    <span className={styles.anchor}>
      {anchorType === 'specimen' ? (
        <span
          className={styles.anchorThumb}
          style={{ background: anchorTile(hue) }}
        />
      ) : (
        <span className={styles.anchorIc} style={{ color: anchorInk(hue) }}>
          {Icon && <Icon size={13} stroke={1.9} />}
        </span>
      )}
      <span className={styles.anchorName}>{name}</span>
      {code && <span className={styles.anchorCode}>{code}</span>}
    </span>
  );

  if (!linked || !href) return chip;

  return (
    <Link href={href} style={{ textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
      {chip}
    </Link>
  );
}
