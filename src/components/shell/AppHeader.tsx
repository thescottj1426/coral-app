'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Avatar,
  Group,
  Menu,
  Text,
} from '@mantine/core';
import {
  IconSeeding,
  IconSearch,
  IconUser,
  IconLogout,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { signOut, useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { coralIdentityGradient } from '@/theme/theme';
import { NAV_ITEMS } from '@/lib/nav';
import { NotificationBell } from './NotificationBell';
import styles from './shell.module.css';

const NAV_TABS = NAV_ITEMS;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { data: session, isPending } = useSession();
  const handle = session?.user?.name ?? session?.user?.email ?? '';
  const initial = isPending ? '…' : (handle[0]?.toUpperCase() ?? '?');
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/me').then((r) => r.json()).then((d) => setProfileUsername(d.username ?? null));
  }, [session?.user?.id]);

  function isActive(href: string) {
    if (href === '/collection') return pathname.startsWith('/collection');
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div className={styles.header}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoMark}>
          <IconSeeding size={13} stroke={2.2} color="#fff" />
        </span>
        Coral Chest
      </Link>

      <nav className={styles.tabNav}>
        {NAV_TABS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.tabLink} ${isActive(href) ? styles.tabLinkActive : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <form
        className={styles.searchButton}
        action="/search"
        method="get"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value ?? '';
          router.push(`/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <IconSearch size={14} aria-hidden />
        <input
          name="q"
          placeholder="Search specimens, collectors, RF codes…"
          className={styles.searchInput}
          aria-label="Search"
          autoComplete="off"
        />
      </form>

      <div className={styles.headerRight}>
        {session?.user && <NotificationBell />}
        <Menu shadow="md" width={180} position="bottom-end">
          <Menu.Target>
            <Avatar
              size={32}
              radius="xl"
              style={{ cursor: 'pointer', background: coralIdentityGradient(handle + '_av') }}
            >
              {initial}
            </Avatar>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconUser size={14} />}
              component={Link}
              href={profileUsername ? `/users/${profileUsername}` : '/collection'}
            >
              Profile
            </Menu.Item>
            <Menu.Item
              leftSection={
                colorScheme === 'dark' ? (
                  <IconSun size={14} />
                ) : (
                  <IconMoon size={14} />
                )
              }
              onClick={() => toggleColorScheme()}
            >
              {colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={14} />}
              onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push('/sign-in') } })}
            >
              Sign out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}
