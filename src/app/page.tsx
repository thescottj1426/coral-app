import type { Metadata } from 'next';
import Link from 'next/link';
import { getExploreSpecimens } from '@/app/actions/explore';
import { getHomeStats, getDeepestChain, getTopKeepers, getHomeActivity } from '@/app/actions/home';
import { siteUrl } from '@/lib/siteUrl';
import { coralIdentityGradient } from '@/theme/theme';
import { HomeSpecimens } from './HomeSpecimens';
import { HomeHeaderAuth, HomeHeroCta } from './HomeAuth';
import styles from './home.module.css';

const BASE = siteUrl();

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Coral Chest — trace the lineage of every coral',
  description:
    'A public registry for reef corals. Every specimen carries an RF code, a photo history and a verified parent. Log yours, pass frags, and the lineage builds itself.',
  alternates: { canonical: BASE },
  openGraph: {
    title: 'Coral Chest — trace the lineage of every coral',
    description:
      'Every specimen carries an RF code, a photo history and a verified parent. Log yours, pass frags, and the lineage builds itself.',
    url: BASE,
    type: 'website',
  },
};

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function LandingPage() {
  // Every query is wrapped — this is the crawlable entry point and must render
  // even if the database is unreachable.
  const [specimens, stats, chain, keepers, activity] = await Promise.all([
    getExploreSpecimens().then((r) => r.slice(0, 8)).catch(() => []),
    getHomeStats().catch(() => ({ specimens: 0, chains: 0, keepers: 0, farms: 0, loggedToday: 0 })),
    getDeepestChain().catch(() => null),
    getTopKeepers(5).catch(() => []),
    getHomeActivity(6).catch(() => []),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 21V9" /><path d="M12 13c0-3 2.5-5 5-5" />
              <path d="M12 15c0-3-2.5-5-5-5" /><path d="M5 21h14" />
            </svg>
          </span>
          <span className={styles.brandName}>Coral Chest</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/explore" className={styles.navLink}>Explore</Link>
          <Link href="/explore" className={styles.navLink}>Lineage</Link>
          <Link href="/explore" className={styles.navLink}>Farms</Link>
        </nav>

        <div className={styles.searchWrap}>
          <form action="/explore" className={styles.searchInner}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#848d9b" strokeWidth="2.4" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="q"
              className={styles.search}
              placeholder="Search a name, species, or RF code"
              aria-label="Search corals"
            />
          </form>
        </div>

        <HomeHeaderAuth />
      </header>

      <section className={styles.hero}>
        <div>
          <div className={styles.livePill}>
            <span className={styles.liveDot} />
            {stats.loggedToday} specimen{stats.loggedToday !== 1 ? 's' : ''} logged in the last 24 hours
          </div>
          <h1 className={styles.h1}>The collector&apos;s log for reef hobbyists</h1>
          <p className={styles.lede}>
            Every specimen carries an RF code, a photo history and a verified parent.
            Log yours, pass frags, and the lineage builds itself.
          </p>
          <HomeHeroCta />

          <div className={styles.heroStats}>
            {[
              { v: stats.specimens, k: 'Specimens' },
              { v: stats.chains, k: 'Chains' },
              { v: stats.keepers, k: 'Keepers' },
              { v: stats.farms, k: 'Farms' },
            ].map((s) => (
              <div key={s.k} className={styles.heroStat}>
                <div className={styles.heroStatNum}>{s.v.toLocaleString()}</div>
                <div className={styles.heroStatKey}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {chain && (
          <div className={styles.chainCard}>
            <div className={styles.chainHead}>
              <span className={styles.kicker}>Deepest chain right now</span>
              <Link href={`/coral/${chain.tipRfCode ?? chain.tipId}`} className={styles.link}>Open</Link>
            </div>
            <div className={styles.chainBody}>
              <div className={styles.chainTop}>
                <div
                  className={styles.chainThumb}
                  style={{ background: coralIdentityGradient(chain.tipRfCode ?? chain.tipId) }}
                />
                <div style={{ minWidth: 0 }}>
                  <div className={styles.chainName}>{chain.name}</div>
                  {chain.species && <div className={styles.chainSpecies}>{chain.species}</div>}
                  <div className={styles.chainSpan}>
                    {chain.rootRfCode ?? 'origin'} → {chain.tipRfCode ?? 'tip'}
                  </div>
                </div>
              </div>

              {/* One segment per generation in the chain, the last one lit. */}
              <div className={styles.chainDots}>
                {(() => {
                  const segments = Math.max(chain.depth + 1, 4);
                  return Array.from({ length: segments }, (_, i) => (
                    <span
                      key={i}
                      className={`${styles.chainDot} ${i === segments - 1 ? styles.chainDotLast : ''}`}
                    />
                  ));
                })()}
              </div>

              <div className={styles.chainMeta}>
                <span>{chain.origin ?? 'Origin unrecorded'}</span>
                <span>Gen {chain.depth}</span>
              </div>

              <div className={styles.chainStats}>
                {[
                  { v: chain.depth, k: 'Gens' },
                  { v: stats.chains, k: 'Frags' },
                  { v: stats.keepers, k: 'Keepers' },
                ].map((s) => (
                  <div key={s.k} className={styles.chainStat}>
                    <div className={styles.chainStatNum}>{s.v}</div>
                    <div className={styles.chainStatKey}>{s.k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {specimens.length > 0 && (
        <section className={styles.section}>
          <HomeSpecimens
            specimens={specimens.map((s) => ({
              id: s.id,
              name: s.name,
              species: s.species,
              category: s.category,
              rfCode: s.rfCode,
              coverPhotoUrl: s.coverPhotoUrl,
              ownerUsername: s.ownerUsername,
              createdAt: s.createdAt,
            }))}
          />
        </section>
      )}

      <section className={styles.split}>
        <div>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>Lineage activity</h2>
            <Link href="/explore" className={styles.link}>All chains</Link>
          </div>
          <div className={styles.panel}>
            {activity.length === 0 ? (
              <p className={styles.empty}>No activity yet.</p>
            ) : (
              activity.map((a) => (
                <Link
                  key={a.id}
                  href={`/coral/${a.rfCode ?? a.coralId}`}
                  className={styles.linRow}
                >
                  <span className={`${styles.linCode} ${styles.mono}`}>{a.rfCode ?? '—'}</span>
                  <span className={styles.linEvent}>{a.event}</span>
                  <span className={styles.linWho}>{a.who ? `@${a.who}` : 'Unclaimed'}</span>
                  <span className={styles.linAgo}>{ago(a.createdAt)}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>Top keepers</h2>
            <span className={styles.sub}>by frags traced</span>
          </div>
          <div className={styles.panel}>
            {keepers.length === 0 ? (
              <p className={styles.empty}>No keepers yet.</p>
            ) : (
              keepers.map((k, i) => (
                <Link key={k.username} href={`/users/${k.username}`} className={styles.keeperRow}>
                  <span className={styles.rank}>{i + 1}</span>
                  <span className={styles.avLg}>{k.username.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={styles.keeperHandle}>@{k.username}</div>
                    <div className={styles.keeperSub}>
                      {k.corals} specimen{k.corals !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span className={styles.keeperFrags}>{k.frags}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
