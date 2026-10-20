import { describe, it, expect, vi, beforeEach } from 'vitest';

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  scope: { setTag: vi.fn(), setContext: vi.fn() },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: sentry.captureException,
  captureMessage: sentry.captureMessage,
  logger: sentry.logger,
  withScope: (cb: (scope: unknown) => unknown) => cb(sentry.scope),
  startSpan: (_opts: unknown, fn: () => unknown) => fn(),
}));

const rethrow = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock('next/navigation', () => ({ unstable_rethrow: rethrow.fn }));

const { trackAction, withRoute } = await import('./log');

beforeEach(() => vi.clearAllMocks());

describe('trackAction', () => {
  it('returns the result and reports nothing on success', async () => {
    const result = await trackAction('getThing', { id: 'c1' }, async () => ({ id: 'c1' }));

    expect(result).toEqual({ id: 'c1' });
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.logger.warn).not.toHaveBeenCalled();
    expect(sentry.logger.error).not.toHaveBeenCalled();
  });

  it('reports a thrown error as an Issue named for the call, with its inputs', async () => {
    const boom = new Error('connection reset');

    await expect(trackAction('claimFrag', { rfCode: 'RF-AB12' }, async () => { throw boom; })).rejects.toBe(boom);

    expect(sentry.captureException).toHaveBeenCalledWith(boom, {
      tags: { action: 'claimFrag' },
      contexts: { input: { action: 'claimFrag', rfCode: 'RF-AB12' } },
    });
    expect(sentry.logger.error).toHaveBeenCalledWith('claimFrag failed: connection reset', {
      action: 'claimFrag',
      rfCode: 'RF-AB12',
    });
  });

  it('rethrows the original error unchanged', async () => {
    const boom = new TypeError('bad');
    await expect(trackAction('x', {}, async () => { throw boom; })).rejects.toBe(boom);
  });

  it('logs a returned { error } as a warning, not an Issue', async () => {
    const result = await trackAction('claimFrag', { rfCode: 'RF-AB12' }, async () => ({
      error: "You can't claim your own frag",
    }));

    expect(result).toEqual({ error: "You can't claim your own frag" });
    expect(sentry.logger.warn).toHaveBeenCalledWith("claimFrag refused: You can't claim your own frag", {
      action: 'claimFrag',
      rfCode: 'RF-AB12',
    });
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('does not treat an empty error field as a refusal', async () => {
    await trackAction('restoreSpecimen', { id: 'c1' }, async () => ({ error: undefined }));
    expect(sentry.logger.warn).not.toHaveBeenCalled();
  });

  it('redacts sensitive inputs before they reach Sentry', async () => {
    await expect(
      trackAction('updateProfile', { password: 'hunter2', email: 'dave@example.com' }, async () => {
        throw new Error('nope');
      })
    ).rejects.toThrow();

    const attrs = sentry.logger.error.mock.calls[0][1];
    expect(attrs.password).toBe('[REDACTED]');
    expect(attrs.email).toBe('d***@example.com');
  });

  // redirect() and notFound() are thrown on purpose and must not be reported.
  it("lets Next's control-flow throws pass through unreported", async () => {
    const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/x' });
    rethrow.fn.mockImplementationOnce((err: unknown) => { throw err; });

    await expect(trackAction('x', {}, async () => { throw redirect; })).rejects.toBe(redirect);
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});

describe('withRoute', () => {
  const req = (path = '/api/image?key=k', method = 'GET') => new Request(`http://localhost${path}`, { method });

  it('passes a successful response through without logging', async () => {
    const handler = withRoute('api.image', async () => new Response('ok', { status: 200 }));
    const res = await handler(req(), undefined);

    expect(res.status).toBe(200);
    expect(sentry.logger.warn).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('logs a 4xx as a warning only', async () => {
    const handler = withRoute('api.auth', async () => new Response('no', { status: 401 }));
    await handler(req('/api/auth/sign-in/email', 'POST'), undefined);

    expect(sentry.logger.warn).toHaveBeenCalledWith('api.auth responded 401', {
      route: 'api.auth',
      method: 'POST',
      path: '/api/auth/sign-in/email',
      status: 401,
    });
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('reports a 5xx as an Issue', async () => {
    const handler = withRoute('api.upload', async () => new Response('down', { status: 503 }));
    await handler(req('/api/upload', 'POST'), undefined);

    expect(sentry.captureMessage).toHaveBeenCalledWith('api.upload responded 503', {
      level: 'error',
      tags: { route: 'api.upload' },
    });
  });

  it('captures a thrown error with the route and rethrows it', async () => {
    const boom = new Error('S3 unavailable');
    const handler = withRoute('api.image', async () => { throw boom; });

    await expect(handler(req(), undefined)).rejects.toBe(boom);
    expect(sentry.captureException).toHaveBeenCalledWith(boom, {
      tags: { route: 'api.image' },
      contexts: { request: { route: 'api.image', method: 'GET', path: '/api/image' } },
    });
  });
});
