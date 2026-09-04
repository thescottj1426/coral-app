'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import styles from './home.module.css';

/**
 * The landing page is statically rendered so crawlers get real HTML and it
 * stays cacheable, which means it cannot know the session at render time.
 * These fragments resolve it on the client.
 *
 * No flash on refresh: the last known state is cached in localStorage and read
 * during render via useSyncExternalStore, so a returning visitor gets the right
 * markup on the very first client paint rather than after a network round-trip.
 * Until anything is known, a same-size invisible placeholder holds the space —
 * so the first paint never shows the *wrong* state and nothing shifts later.
 *
 * useSyncExternalStore rather than setState-in-an-effect: it has a server
 * snapshot (null), so hydration matches, and it avoids the cascading render the
 * effect version caused.
 */
const CACHE_KEY = 'cc:auth';
const EVENT = 'cc:auth-change';

type Auth = { username: string | null };

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // 'storage' fires in *other* tabs — keeps them in sync on sign-in/out.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Returns the raw string so the reference is stable between reads. */
function getSnapshot(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function useAuth(): Auth | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let alive = true;
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : { username: null }))
      .then((d) => {
        if (!alive) return;
        const next = JSON.stringify({ username: d.username ?? null });
        if (next === localStorage.getItem(CACHE_KEY)) return;
        localStorage.setItem(CACHE_KEY, next);
        window.dispatchEvent(new Event(EVENT));
      })
      .catch(() => {
        // Keep the cached value rather than flipping to logged-out on a
        // transient network failure.
      });
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Auth;
    } catch {
      return null;
    }
  }, [raw]);
}

export function HomeHeaderAuth() {
  const auth = useAuth();

  if (auth === null) {
    return (
      <div className={styles.headerCtas} style={{ visibility: 'hidden' }} aria-hidden>
        <span className={styles.act}>Sign in</span>
        <span className={styles.pri}>Join free</span>
      </div>
    );
  }

  if (auth.username) {
    return (
      <div className={styles.headerCtas}>
        <Link href="/feed" className={styles.act}>Feed</Link>
        <Link href="/collection" className={styles.pri}>My collection</Link>
      </div>
    );
  }

  return (
    <div className={styles.headerCtas}>
      <Link href="/sign-in" className={styles.act}>Sign in</Link>
      <Link href="/sign-up" className={styles.pri}>Join free</Link>
    </div>
  );
}

export function HomeHeroCta() {
  const auth = useAuth();

  if (auth === null) {
    return (
      <div className={styles.heroCtas} style={{ visibility: 'hidden' }} aria-hidden>
        <span className={styles.ctaPri}>Start your chest</span>
        <span className={styles.ctaAct}>Browse specimens</span>
      </div>
    );
  }

  if (auth.username) {
    return (
      <div className={styles.heroCtas}>
        <Link href="/collection" className={styles.ctaPri}>Go to your collection</Link>
        <Link href="/explore" className={styles.ctaAct}>Browse specimens</Link>
      </div>
    );
  }

  return (
    <div className={styles.heroCtas}>
      <Link href="/sign-up" className={styles.ctaPri}>Start your chest</Link>
      <Link href="/explore" className={styles.ctaAct}>Browse specimens</Link>
    </div>
  );
}
