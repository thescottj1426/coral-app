import * as Sentry from '@sentry/nextjs';

export { maskEmail } from './logRedact';

// Sentry log attributes accept only these value types.
type Attrs = Record<string, string | number | boolean>;

/**
 * Business milestones worth being able to search later — "frag claimed",
 * "coral created". Not errors. Prefer ONE wide log with full context over
 * several fragmented ones.
 */
export function event(message: string, attrs?: Attrs) {
  Sentry.logger.info(message, attrs);
}

export function warn(message: string, attrs?: Attrs) {
  Sentry.logger.warn(message, attrs);
}

export function error(message: string, attrs?: Attrs) {
  Sentry.logger.error(message, attrs);
}

/** Dropped in production by beforeSendLog. */
export function debug(message: string, attrs?: Attrs) {
  Sentry.logger.debug(message, attrs);
}

/**
 * Assert something that should always be true. When it isn't, report it as a
 * real Sentry issue — not just a log line.
 *
 * This exists because every data bug that has actually hurt this project threw
 * nothing: inner joins matching zero rows, UPDATEs touching no rows, lookups
 * returning null. Valid SQL, wrong answer, silent. Exception capture cannot
 * see any of it.
 *
 *   invariant('profile.update_matched_no_rows', res.rowCount === 1, { userId })
 */
export function invariant(name: string, condition: boolean, attrs?: Attrs): boolean {
  if (condition) return true;

  Sentry.logger.error(`invariant failed: ${name}`, attrs);
  Sentry.captureMessage(`invariant failed: ${name}`, {
    level: 'error',
    tags: { invariant: name },
    extra: attrs,
  });
  return false;
}
