'use client';

import Link from 'next/link';
import { useViewer } from '@/lib/useViewer';
import styles from './home.module.css';

export function HomeHeaderAuth() {
  const auth = useViewer();

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
  const auth = useViewer();

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
