import type { MetadataRoute } from 'next';
import { getPublicUrls } from '@/app/actions/specimens';

import { siteUrl } from '@/lib/siteUrl';

const BASE = siteUrl();

// Regenerate hourly so newly added corals get discovered without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,               changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE}/explore`,  changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/terms`,    changeFrequency: 'yearly',  priority: 0.1 },
    { url: `${BASE}/privacy`,  changeFrequency: 'yearly',  priority: 0.1 },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const rows = await getPublicUrls();
    dynamicPages = rows.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: new Date(r.updatedAt),
      changeFrequency: r.path.startsWith('/coral/') ? ('weekly' as const) : ('monthly' as const),
      priority: r.path.startsWith('/coral/') ? 0.8 : 0.5,
    }));
  } catch {
    // A database hiccup must not produce a 500 sitemap — serve the static set
    // rather than nothing, so crawlers still have an entry point.
  }

  return [...staticPages, ...dynamicPages];
}
