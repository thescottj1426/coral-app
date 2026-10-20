import * as Sentry from '@sentry/nextjs';
import { unstable_rethrow } from 'next/navigation';
import { summarizeInput } from './logRedact';

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

function refusal(result: unknown): string | null {
  if (result && typeof result === 'object' && 'error' in result) {
    const e = (result as { error: unknown }).error;
    if (typeof e === 'string' && e) return e;
  }
  return null;
}

/**
 * Every server action runs through this, so any failure reaches Sentry named,
 * with what the call was given.
 *
 * Throws are captured as Issues (tagged `action`) and rethrown untouched.
 * A returned `{ error }` is a refusal, not a crash — "can't claim your own
 * frag" — so it becomes a warning log rather than an alert. Success logs
 * nothing.
 *
 * Wrap inside the function body; keep `export async function`. Changing how a
 * 'use server' file exports is what produced the NotificationType crash.
 */
export async function trackAction<T>(
  name: string,
  input: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const attrs = { action: name, ...summarizeInput(input) };

  return Sentry.withScope(async (scope) => {
    scope.setTag('action', name);
    scope.setContext('input', attrs);

    try {
      const result = await Sentry.startSpan({ name: `action:${name}`, op: 'server.action' }, fn);
      const reason = refusal(result);
      if (reason) Sentry.logger.warn(`${name} refused: ${reason}`, attrs);
      return result;
    } catch (err) {
      // redirect(), notFound() and dynamic-rendering bail-outs are thrown on
      // purpose. Pass them through untouched rather than report them.
      unstable_rethrow(err);
      const message = err instanceof Error ? err.message : String(err);
      Sentry.logger.error(`${name} failed: ${message}`, attrs);
      // Marks the error as reported, so onRequestError does not send it twice.
      Sentry.captureException(err, { tags: { action: name }, contexts: { input: attrs } });
      throw err;
    }
  });
}

// Generic over the request type so a handler written against NextRequest keeps
// that type.
type RouteHandler<R extends Request, C> = (request: R, context: C) => Promise<Response>;

/**
 * The same for API route handlers. A thrown error is captured and rethrown; a
 * 5xx response is an error log; a 4xx is a warning only, since a wrong password
 * or a missing image is normal traffic.
 */
export function withRoute<R extends Request, C = unknown>(
  name: string,
  handler: RouteHandler<R, C>
): RouteHandler<R, C> {
  return async (request, context) => {
    const path = new URL(request.url).pathname;
    const attrs = { route: name, method: request.method, path };

    return Sentry.withScope(async (scope) => {
      scope.setTag('route', name);
      scope.setContext('request', attrs);

      try {
        const response = await handler(request, context);
        if (response.status >= 500) {
          Sentry.logger.error(`${name} responded ${response.status}`, { ...attrs, status: response.status });
          Sentry.captureMessage(`${name} responded ${response.status}`, { level: 'error', tags: { route: name } });
        } else if (response.status >= 400) {
          Sentry.logger.warn(`${name} responded ${response.status}`, { ...attrs, status: response.status });
        }
        return response;
      } catch (err) {
        unstable_rethrow(err);
        const message = err instanceof Error ? err.message : String(err);
        Sentry.logger.error(`${name} failed: ${message}`, attrs);
        Sentry.captureException(err, { tags: { route: name }, contexts: { request: attrs } });
        throw err;
      }
    });
  };
}
