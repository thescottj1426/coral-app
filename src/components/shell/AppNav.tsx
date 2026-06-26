'use client';

import { usePathname } from 'next/navigation';
import { NavLink, Text } from '@mantine/core';
import {
  IconSeeding,
  IconCompass,
  IconRss,
  IconUser,
  IconMessageCircle,
  IconLayoutDashboard,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import styles from './shell.module.css';

const COMMUNITY_NAV = [
  { label: 'Explore',     href: '/explore',  icon: IconCompass },
  { label: 'Discuss',     href: '/discuss',  icon: IconMessageCircle },
  { label: 'Feed',        href: '/feed',     icon: IconRss },
];

const TOP_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/me').then((r) => r.json()).then((d) => {
      setUsername(d.username ?? null);
      setIsAdmin(d.isAdmin ?? false);
    });
  }, [session?.user?.id]);

  const profileHref = username ? `/users/${username}` : '/collection';

  return (
    <nav className={styles.nav}>
      {TOP_NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <NavLink
            key={href}
            href={href}
            label={label}
            leftSection={<Icon size={16} stroke={1.7} />}
            active={active}
            styles={{ root: { borderRadius: 'var(--fb-radius)', fontWeight: active ? 600 : undefined } }}
          />
        );
      })}

      {isAdmin && (
        <NavLink
          href="/admin"
          label="Admin"
          leftSection={<IconShieldCheck size={16} stroke={1.7} color="var(--mantine-color-red-6)" />}
          active={pathname.startsWith('/admin')}
          styles={{ root: { borderRadius: 'var(--fb-radius)', fontWeight: pathname.startsWith('/admin') ? 600 : undefined } }}
        />
      )}

      <div className={styles.navSection} style={{ marginTop: 8 }}>
        <Text className={styles.eyebrow}>You</Text>
      </div>

      {[
        { label: 'My Collection', href: '/collection', icon: IconSeeding },
        { label: 'Profile',       href: profileHref,   icon: IconUser },
      ].map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <NavLink
            key={label}
            href={href}
            label={label}
            leftSection={<Icon size={16} stroke={1.7} />}
            active={active}
            styles={{ root: { borderRadius: 'var(--fb-radius)', fontWeight: active ? 600 : undefined } }}
          />
        );
      })}

      <div className={styles.navSection} style={{ marginTop: 20 }}>
        <Text className={styles.eyebrow}>Community</Text>
      </div>

      {COMMUNITY_NAV.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <NavLink
            key={href}
            href={href}
            label={label}
            leftSection={<Icon size={16} stroke={1.7} />}
            active={active}
            styles={{
              root: {
                borderRadius: 'var(--fb-radius)',
                fontWeight: active ? 600 : undefined,
              },
            }}
          />
        );
      })}
    </nav>
  );
}
