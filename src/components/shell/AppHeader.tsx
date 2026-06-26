'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Avatar,
  Burger,
  Group,
  Menu,
  Button,
  Text,
} from '@mantine/core';
import {
  IconLayoutGrid,
  IconSearch,
  IconBell,
  IconUser,
  IconLogout,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { signOut, useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { coralIdentityGradient } from '@/theme/theme';
import styles from './shell.module.css';

interface AppHeaderProps {
  mobileNavOpen: boolean;
  onBurger: () => void;
}

export function AppHeader({ mobileNavOpen, onBurger }: AppHeaderProps) {
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

  return (
    <div className={styles.header}>
      <Burger
        opened={mobileNavOpen}
        onClick={onBurger}
        size="sm"
        hiddenFrom="md"
      />

      <Link href="/" className={styles.logo}>
        <span className={styles.logoMark}>
          <IconLayoutGrid size={13} stroke={2.2} color="#fff" />
        </span>
        polyp
      </Link>

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
        <Button
          variant="light"
          size="xs"
          component={Link}
          href="/collection"
        >
          My Collection
        </Button>

        <ActionIcon variant="default" size="md" aria-label="Notifications">
          <IconBell size={16} stroke={1.7} />
        </ActionIcon>

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
