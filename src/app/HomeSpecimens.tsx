'use client';

import { useState } from 'react';
import Link from 'next/link';
import { coralIdentityGradient } from '@/theme/theme';
import styles from './home.module.css';

export type HomeSpecimen = {
  id: string;
  name: string;
  species: string | null;
  category: string | null;
  rfCode: string | null;
  coverPhotoUrl: string | null;
  ownerUsername: string;
  createdAt: string;
};

// Design maps SPS/LPS/Zoa/Softie to distinct tag colours.
const TAG_COLOR: Record<string, string> = {
  SPS: '#a8b8ff',
  LPS: '#f0b98a',
  ZOA: '#6fd39a',
  SOFTIE: '#e894c0',
};

const CATS = [
  { label: 'All', value: 'All' },
  { label: 'SPS', value: 'SPS' },
  { label: 'LPS', value: 'LPS' },
  { label: 'Zoa', value: 'ZOA' },
  { label: 'Softie', value: 'SOFTIE' },
];

function label(cat: string | null) {
  if (!cat) return '—';
  return cat === 'SOFTIE' ? 'Softie' : cat === 'ZOA' ? 'Zoa' : cat;
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const chipBase: React.CSSProperties = {
  font: `700 12.5px var(--font-sora), system-ui, sans-serif`,
  padding: '7px 13px',
  borderRadius: 999,
  cursor: 'pointer',
  transition: 'all .15s ease',
};

export function HomeSpecimens({ specimens }: { specimens: HomeSpecimen[] }) {
  const [cat, setCat] = useState('All');
  const shown = specimens.filter((s) => cat === 'All' || s.category === cat);

  return (
    <>
      <div className={styles.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 className={styles.h2}>Logged this week</h2>
          <span className={styles.sub}>
            {shown.length} of {specimens.length} shown
          </span>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              style={{
                ...chipBase,
                ...(c.value === cat
                  ? { background: '#3f5be0', color: '#fff', border: '1px solid #3f5be0' }
                  : { background: 'transparent', color: '#8b93a3', border: '1px solid #262c36' }),
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.cardGrid}>
        {shown.map((s) => (
          <Link key={s.id} href={`/coral/${s.rfCode ?? s.id}`} className={styles.crd}>
            <div className={styles.crdPhoto}>
              <div
                className={styles.shot}
                style={
                  s.coverPhotoUrl
                    ? { backgroundImage: `url(${s.coverPhotoUrl})` }
                    : { background: coralIdentityGradient(s.rfCode ?? s.id) }
                }
              />
              <span className={styles.tag} style={{ color: TAG_COLOR[s.category ?? ''] ?? '#c8cdd8' }}>
                {label(s.category)}
              </span>
            </div>
            <div className={styles.crdBody}>
              <div className={styles.crdTop}>
                <span className={styles.crdName}>{s.name}</span>
                <span className={`${styles.crdCode} ${styles.mono}`}>{s.rfCode ?? '—'}</span>
              </div>
              <div className={styles.crdSpecies}>{s.species ?? ' '}</div>
              <div className={styles.crdFoot}>
                <div className={styles.av}>{s.ownerUsername.charAt(0).toUpperCase()}</div>
                <span className={styles.crdKeeper}>@{s.ownerUsername}</span>
                <span className={styles.crdAgo}>{ago(s.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
