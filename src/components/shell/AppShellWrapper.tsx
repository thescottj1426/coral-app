'use client';

import { AppShell } from '@mantine/core';
import { Spotlight, SpotlightActionData } from '@mantine/spotlight';
import { useRouter } from 'next/navigation';
import {
  IconSeeding,
  IconCompass,
  IconUser,
} from '@tabler/icons-react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './AppNav';
import styles from './shell.module.css';

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const SPOTLIGHT_ACTIONS: SpotlightActionData[] = [
    {
      id: 'collection',
      label: 'My Collection',
      description: 'Browse your specimens',
      onClick: () => router.push('/collection'),
      leftSection: <IconSeeding size={18} stroke={1.7} />,
    },
    {
      id: 'explore',
      label: 'Explore',
      description: 'Discover specimens and collectors',
      onClick: () => router.push('/explore'),
      leftSection: <IconCompass size={18} stroke={1.7} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      description: 'Your public collector page',
      onClick: () => router.push('/collection'),
      leftSection: <IconUser size={18} stroke={1.7} />,
    },
  ];

  return (
    <>
      <Spotlight
        actions={SPOTLIGHT_ACTIONS}
        searchProps={{ placeholder: 'Search specimens, collectors, RF codes…' }}
        shortcut="/"
        nothingFound="No results found"
      />
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <AppHeader />
        </AppShell.Header>
        <AppShell.Main bg="var(--fb-app-bg)" className={styles.main}>
          {children}
        </AppShell.Main>
      </AppShell>
      <BottomNav />
    </>
  );
}
