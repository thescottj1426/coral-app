/**
 * The origin better-auth signs OAuth callbacks against.
 *
 * Deliberately NOT siteUrl(). That one always resolves to the production
 * domain on Vercel, which is right for canonicals and OG tags and wrong here:
 * a preview deployment must send Google back to the preview, not to
 * production. The two answers genuinely differ, so they are two functions.
 *
 * The trap this closes: with no explicit baseURL, better-auth follows
 * BETTER_AUTH_URL, and .env.local sets that to http://localhost:3000. Paste
 * that into Vercel — the same way the sitemap once shipped localhost URLs —
 * and production asks Google to redirect to localhost, which Google refuses.
 */
const PRODUCTION_URL = 'https://coral-app-one.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

function isLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(url);
}

function strip(url: string) {
  return url.replace(/\/$/, '');
}

export function authBaseUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === 'production') return PRODUCTION_URL;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelEnv === 'preview' && vercelUrl) return `https://${strip(vercelUrl)}`;

  const configured = process.env.BETTER_AUTH_URL?.trim();
  if (configured && !(process.env.VERCEL && isLocal(configured))) return strip(configured);

  return LOCAL_URL;
}

/**
 * better-auth registers a provider given an empty string just as readily as a
 * real key, producing a button that redirects to a Google error page and logs
 * nothing. An absent credential should mean an absent button.
 */
export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}
