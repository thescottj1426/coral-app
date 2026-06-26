import { Badge } from '@mantine/core';
import type { CoralCategory } from '@/theme/theme';
import styles from './coral.module.css';

const CLASS_MAP: Record<CoralCategory, string> = {
  SPS:     styles.catSps,
  LPS:     styles.catLps,
  SOFTIE:  styles.catSoftie,
  ZOA:     styles.catZoa,
  ANEMONE: styles.catAnemone,
  OTHER:   styles.catOther,
};

const LABEL_MAP: Record<CoralCategory, string> = {
  SPS: 'SPS', LPS: 'LPS', SOFTIE: 'Softie', ZOA: 'Zoa', ANEMONE: 'Anemone', OTHER: 'Other',
};

export function CategoryBadge({ category }: { category: CoralCategory }) {
  return (
    <Badge variant="light" radius="xl" size="sm" className={CLASS_MAP[category]}>
      {LABEL_MAP[category]}
    </Badge>
  );
}
