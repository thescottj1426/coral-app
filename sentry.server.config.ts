import * as Sentry from '@sentry/nextjs';
import { scrubLog } from '@/lib/logRedact';

Sentry.init({
  dsn:
    // || not ??: an empty SENTRY_DSN in Vercel would otherwise disable Sentry
    // silently instead of falling back.
    process.env.SENTRY_DSN ||
    'https://4fb3e5f9978beb18f27e26a43daf66c8@o4512023905370112.ingest.us.sentry.io/4512023916904448',

  // Keeps local/dev noise separate from real production errors in the dashboard.
  // VERCEL_ENV separates production from preview; anything off Vercel is local.
  environment: process.env.VERCEL_ENV ?? 'development',

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Attaches local variable values to stack frames. Very useful for debugging,
  // but it means locals in scope at the throw site (emails, S3 keys) reach Sentry.
  includeLocalVariables: true,

  enableLogs: true,
  beforeSendLog: scrubLog,
});
