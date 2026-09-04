'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { coralIdentityGradient } from '@/theme/theme';
import type { ExploreSpecimen, ExploreCollector } from '@/app/actions/explore';
import styles from './explore.module.css';

const CATS = [
  { label: 'All', value: 'All' },
  { label: 'SPS', value: 'SPS' },
  { label: 'LPS', value: 'LPS' },
  { label: 'Zoa', value: 'ZOA' },
  { label: 'Softie', value: 'SOFTIE' },
  { label: 'Anemone', value: 'ANEMONE' },
];

function catLabel(cat: string | null) {
  if (!cat) return 'Other';
  const found = CATS.find((c) => c.value === cat);
  return found ? found.label : cat;
}

function initial(handle: string) {
  return handle.charAt(0).toUpperCase();
}

interface Props {
  specimens: ExploreSpecimen[];
  collectors: ExploreCollector[];
}

export function ExploreClient({ specimens, collectors }: Props) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return specimens.filter((s) => {
      const matchesCat = filter === 'All' || s.category === filter;
      if (!matchesCat) return false;
      if (!q) return true;
      return [s.name, s.species, s.ownerUsername, s.rfCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [specimens, filter, query]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div style={{ minWidth: 0 }}>
            <div className={styles.pill}>Explore</div>
            <h1 className={styles.h1}>
              {specimens.length} specimen{specimens.length !== 1 ? 's' : ''} from the community
            </h1>
            <p className={styles.lede}>
              Frags, mother colonies and RF-coded lineage, catalogued by the reefers growing them.
            </p>
          </div>

          <div className={styles.searchWrap}>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#9096b0" strokeWidth="2.2" className={styles.searchIcon}
            >
              <circle cx="11" cy="11" r="7.5" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className={styles.search}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search corals, species, or collectors"
              aria-label="Search corals, species, or collectors"
            />
          </div>
        </div>
      </section>

      {collectors.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.railHead}>
              <span className={styles.kicker}>Collectors</span>
              <span className={styles.rule} />
            </div>
            <div className={styles.collectorGrid}>
              {collectors.map((c) => (
                <Link key={c.id} href={`/users/${c.username}`} className={styles.collector}>
                  <span className={styles.collectorAv}>{initial(c.username)}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className={styles.collectorName} style={{ display: 'block' }}>
                      @{c.username}
                    </span>
                    <span className={styles.collectorSub}>
                      {c.specimenCount} specimen{c.specimenCount !== 1 ? 's' : ''}
                    </span>
                  </span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#c2c6d8" strokeWidth="2.2" strokeLinecap="round" style={{ flex: 'none' }}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.resultsSection}>
        <div className={styles.sectionInner}>
          <div className={styles.filterBar}>
            <div className={styles.chips}>
              {CATS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFilter(c.value)}
                  className={`${styles.chip} ${filter === c.value ? styles.chipOn : ''}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>

          {results.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>No specimens match</div>
              <div className={styles.emptySub}>Try another category, or clear the search.</div>
            </div>
          ) : (
            <div className={styles.grid}>
              {results.map((s) => (
                <Link key={s.id} href={`/coral/${s.rfCode ?? s.id}`} className={styles.card}>
                  <div className={styles.photo}>
                    <div
                      className={styles.shot}
                      style={
                        s.coverPhotoUrl
                          ? { backgroundImage: `url(${s.coverPhotoUrl})` }
                          : { background: coralIdentityGradient(s.rfCode ?? s.id) }
                      }
                    />
                    <span className={styles.tag}>{catLabel(s.category)}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardName}>{s.name}</h3>
                    <div className={styles.cardSpecies}>{s.species ?? ' '}</div>
                    <div className={styles.cardFoot}>
                      <span className={styles.cardAv}>{initial(s.ownerUsername)}</span>
                      <span className={styles.cardCollector}>@{s.ownerUsername}</span>
                      <span className={styles.cardCode}>{s.rfCode ?? ''}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
