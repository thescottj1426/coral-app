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

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => lower.includes(s.toLowerCase()));
}

const MAX_STRING = 120;

/**
 * What a failed call was given, safe to attach to a Sentry event: IDs, codes,
 * enums and numbers survive; secrets and emails do not; long text is cut.
 * Flat string/number/boolean values only, because Sentry log attributes accept
 * nothing else.
 */
export function summarizeInput(input: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (isSensitiveKey(key)) {
      out[key] = '[REDACTED]';
    } else if (value === null) {
      out[key] = 'null';
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else if (typeof value === 'string') {
      out[key] = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
        ? maskEmail(value)
        : value.length > MAX_STRING
          ? `${value.slice(0, MAX_STRING)}… (${value.length} chars)`
          : value;
    } else if (typeof Blob !== 'undefined' && value instanceof Blob) {
      out[key] = `[file ${value.size} bytes]`;
    } else if (Array.isArray(value)) {
      out[key] = `[array of ${value.length}]`;
    } else {
      out[key] = `[object: ${Object.keys(value as object).join(', ').slice(0, MAX_STRING)}]`;
    }
  }
  return out;
}

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
