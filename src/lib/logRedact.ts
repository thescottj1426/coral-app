// Shared scrubbing for Sentry logs. Kept dependency-free so the three
// Sentry runtime configs can import it at startup without pulling in the app.

/** s***@gmail.com — enough to correlate a user, not enough to be PII in a log store. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '(none)';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

/** Attribute keys that must never leave the app in a log. */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'authToken',
  'apiKey',
  'secret',
  'databaseUrl',
  'connectionString',
  's3Key',
  'sessionToken',
];

type SentryLog = {
  level: string;
  message?: string;
  attributes?: Record<string, unknown>;
};

/**
 * beforeSendLog hook: drops noise in production and scrubs sensitive attributes.
 * Return null to discard a log entirely.
 */
export function scrubLog<T extends SentryLog>(log: T): T | null {
  if (process.env.NODE_ENV === 'production' && (log.level === 'debug' || log.level === 'trace')) {
    return null;
  }

  if (log.attributes) {
    for (const key of Object.keys(log.attributes)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lower.includes(s.toLowerCase()))) {
        log.attributes[key] = '[REDACTED]';
      }
      // Catch raw addresses that slipped through under any key name.
      const value = log.attributes[key];
      if (typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        log.attributes[key] = maskEmail(value);
      }
    }
  }

  return log;
}
