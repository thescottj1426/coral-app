import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/siteUrl';

const BASE = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth-gated or private surfaces — crawling these just burns budget on
      // redirects to /sign-in and indexes nothing useful.
      disallow: [
        '/api/',
        '/collection',
        '/collection/',
        '/dashboard',
        '/feed',
        '/search',
        '/claim',
        '/onboarding',
        '/admin',
        '/sign-in',
        '/sign-up',
        '/verify-notice',
        '/forgot-password',
        '/reset-password',
        '/monitoring',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
