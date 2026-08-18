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

const TABS = [
  { label: 'Collect',  href: '/collection', icon: IconSeeding },
  { label: 'Explore',  href: '/explore',    icon: IconCompass },
  { label: 'Discuss',  href: '/discuss',    icon: IconMessageCircle },
  { label: 'Feed',     href: '/feed',       icon: IconRss },
];

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
