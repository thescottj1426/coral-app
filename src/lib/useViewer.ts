'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';

/**
 * Who is looking, resolved on the client.
 *
 * Public pages are statically rendered so crawlers get real HTML and the pages
 * stay cacheable — which means they cannot know the session at render time.
 * Reading it on the server would make the route dynamic and throw the cache
 * away for every visitor, to personalise it for one.
 *
 * No flash on refresh: the last known state is cached in localStorage and read
 * during render via useSyncExternalStore, so a returning visitor gets the right
 * markup on the first client paint rather than after a round-trip. Until
 * anything is known the value is `null`, and callers must render a same-size
 * placeholder rather than guessing — a wrong first paint is worse than a late
 * one.
 *
 * useSyncExternalStore rather than setState-in-an-effect: it has a server
 * snapshot, so hydration matches, and it avoids the cascading render the effect
 * version caused.
 *
 * Extracted from HomeAuth, which had the only copy.
 */
const CACHE_KEY = 'cc:auth';
const EVENT = 'cc:auth-change';

export type Viewer = { username: string | null };

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // 'storage' fires in *other* tabs — keeps them in sync on sign-in/out.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** The raw string, so the reference stays stable between reads. */
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

/** `null` means "not known yet", distinct from a signed-out `{ username: null }`. */
export function useViewer(): Viewer | null {
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
        // Keep the cached value rather than flipping to signed-out on a
        // transient network failure.
      });
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Viewer;
    } catch {
      return null;
    }
  }, [raw]);
}
