'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconSeeding,
  IconCompass,
  IconRss,
  IconMessageCircle,
} from '@tabler/icons-react';
import styles from './shell.module.css';
import { NAV_ITEMS } from '@/lib/nav';

// Routes come from NAV_ITEMS so the landing page cannot drift from this list.
// Only the icons live here — they are client components.
const ICONS = {
  '/collection': IconSeeding,
  '/explore': IconCompass,
  '/discuss': IconMessageCircle,
  '/feed': IconRss,
} as const;

const TABS = NAV_ITEMS.map((item) => ({ ...item, icon: ICONS[item.href] }));

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/collection') return pathname.startsWith('/collection');
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className={styles.bottomNav}>
      {TABS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`${styles.bottomNavItem} ${isActive(href) ? styles.bottomNavItemActive : ''}`}
        >
          <Icon size={20} stroke={1.7} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
