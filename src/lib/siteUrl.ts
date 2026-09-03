/**
 * The public origin, for anything a crawler or a recipient will see: sitemap
 * entries, canonical URLs, OG tags, emailed links.
 *
 * NEXT_PUBLIC_APP_URL is set to http://localhost:3000 in .env.local, which is
 * correct locally and catastrophic in a sitemap — it would publish localhost
 * URLs to Google. So a localhost value is ignored whenever we're on Vercel,
 * where VERCEL_PROJECT_PRODUCTION_URL is the stable production domain.
 */
const FALLBACK = 'https://coral-app-one.vercel.app';

function isLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(url);
}

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const onVercel = Boolean(process.env.VERCEL);

  if (configured && !(onVercel && isLocal(configured))) {
    return configured.replace(/\/$/, '');
  }
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return FALLBACK;
}
