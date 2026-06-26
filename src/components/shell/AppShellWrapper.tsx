'use client';

import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Spotlight, SpotlightActionData } from '@mantine/spotlight';
import { useRouter } from 'next/navigation';
import {
  IconSeeding,
  IconCompass,
  IconUser,
} from '@tabler/icons-react';
import { AppHeader } from './AppHeader';
import { AppNav } from './AppNav';

const SPOTLIGHT_ACTIONS: SpotlightActionData[] = [
  {
    id: 'collection',
    label: 'My Collection',
    description: 'Browse your specimens',
    onClick: () => {},
    leftSection: <IconSeeding size={18} stroke={1.7} />,
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Discover specimens and collectors',
    onClick: () => {},
    leftSection: <IconCompass size={18} stroke={1.7} />,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your public collector page',
    onClick: () => {},
    leftSection: <IconUser size={18} stroke={1.7} />,
  },
];

export function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, { toggle }] = useDisclosure();

  return (
    <>
      <Spotlight
        actions={SPOTLIGHT_ACTIONS}
        searchProps={{ placeholder: 'Search specimens, collectors, RF codes…' }}
        shortcut="/"
        nothingFound="No results found"
      />
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 240,
          breakpoint: 'md',
          collapsed: { mobile: !mobileNavOpen },
        }}
      >
        <AppShell.Header>
          <AppHeader mobileNavOpen={mobileNavOpen} onBurger={toggle} />
        </AppShell.Header>
        <AppShell.Navbar>
          <AppNav />
        </AppShell.Navbar>
        <AppShell.Main bg="var(--fb-app-bg)">
          {children}
        </AppShell.Main>
      </AppShell>
    </>
  );
}
