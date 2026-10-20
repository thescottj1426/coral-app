import * as Sentry from '@sentry/nextjs';
import { scrubLog } from '@/lib/logRedact';

Sentry.init({
  dsn:
    // || not ??: an empty SENTRY_DSN in Vercel would otherwise disable Sentry
    // silently instead of falling back.
    process.env.SENTRY_DSN ||
    'https://4fb3e5f9978beb18f27e26a43daf66c8@o4512023905370112.ingest.us.sentry.io/4512023916904448',

  // VERCEL_ENV separates production from preview; anything off Vercel is local.
  environment: process.env.VERCEL_ENV ?? 'development',

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  enableLogs: true,
  beforeSendLog: scrubLog,
});
