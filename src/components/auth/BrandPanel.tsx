import { IconArrowRight, IconLayoutGrid } from '@tabler/icons-react';
import styles from './auth.module.css';

const LINEAGE_CHIPS = [
  { hue: 210, code: 'RF-001A' },
  { hue: 160, code: 'RF-2K8D' },
  { hue: 25,  code: 'RF-4F2K' },
];

function coralDotGradient(hue: number) {
  return `linear-gradient(135deg, oklch(0.76 0.11 ${hue}), oklch(0.5 0.13 ${hue}))`;
}

export function BrandPanel() {
  return (
    <div className={styles.brand}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>
          <IconLayoutGrid size={13} stroke={2.2} color="#fff" />
        </span>
        polyp
      </div>

      <div className={styles.brandMiddle}>
        <h1 className={styles.brandHeadline}>
          Every coral has a story. Trace&nbsp;it.
        </h1>
        <p className={styles.brandSub}>
          Catalog your collection, document lineage, and connect with collectors
          who care where it came from.
        </p>

        <div className={styles.lineageMotif}>
          {LINEAGE_CHIPS.map((chip, i) => (
            <>
              <div key={chip.code} className={styles.lineageChip}>
                <span
                  className={styles.coralDot}
                  style={{ background: coralDotGradient(chip.hue) }}
                />
                <span className={styles.lineageCode}>{chip.code}</span>
              </div>
              {i < LINEAGE_CHIPS.length - 1 && (
                <IconArrowRight
                  key={`arrow-${i}`}
                  size={13}
                  className={styles.lineageArrow}
                  color="#fff"
                />
              )}
            </>
          ))}
        </div>
        <p className={styles.lineageCaption}>
          GEN 0 → GEN 1 → GEN 2 · LINEAGE IS PERMANENT
        </p>
      </div>

      <p className={styles.brandFooter}>
        12,400 specimens catalogued · 3,100 frags traced
      </p>
    </div>
  );
}
