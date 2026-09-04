/**
 * The one list of primary destinations. Both the app shell and the public
 * landing page read this — the landing page used to carry its own hardcoded
 * copy, which drifted into three labels all pointing at /explore.
 *
 * Plain data, no icons: the landing page is a Server Component, and icons
 * belong to the client components that render them.
 */
export const NAV_ITEMS = [
  { label: 'Collect', href: '/collection' },
  { label: 'Explore', href: '/explore' },
  { label: 'Discuss', href: '/discuss' },
  { label: 'Feed', href: '/feed' },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
