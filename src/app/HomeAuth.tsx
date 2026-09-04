'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './home.module.css';

/**
 * The landing page is statically rendered so crawlers get real HTML and the
 * page stays cacheable. That means it cannot know the session at render time,
 * so the auth-dependent bits hydrate on the client instead.
 *
 * Logged-out markup is rendered first and is what Googlebot sees — which is
 * correct, since a crawler is never signed in.
 */
function useUsername() {
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : { username: null }))
      .then((d) => {
        if (alive) {
          setUsername(d.username ?? null);
          setReady(true);
        }
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  return { username, ready };
}

export function HomeHeaderAuth() {
  const { username, ready } = useUsername();

  if (ready && username) {
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
  const { username, ready } = useUsername();

  if (ready && username) {
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
