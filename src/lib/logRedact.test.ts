import { describe, it, expect, afterEach, vi } from 'vitest';
import { maskEmail, scrubLog } from './logRedact';

describe('maskEmail', () => {
  it('masks the local part but keeps the domain', () => {
    expect(maskEmail('scottj1426@gmail.com')).toBe('s***@gmail.com');
  });

  it.each([null, undefined, ''])('returns (none) for %s', (input) => {
    expect(maskEmail(input)).toBe('(none)');
  });

  it('returns *** when there is no domain', () => {
    expect(maskEmail('not-an-email')).toBe('***');
  });
});

describe('scrubLog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('redacts a sensitive key', () => {
    const out = scrubLog({ level: 'info', attributes: { password: 'hunter2' } });
    expect(out?.attributes?.password).toBe('[REDACTED]');
  });

  // SENSITIVE_KEYS matches by substring, so a key that merely contains one counts.
  it.each(['apiKey', 'userApiKeyValue', 'APIKEY', 'sessionToken', 'connectionString'])(
    'redacts key %s',
    (key) => {
      const out = scrubLog({ level: 'info', attributes: { [key]: 'secret-value' } });
      expect(out?.attributes?.[key]).toBe('[REDACTED]');
    }
  );

  it('masks a raw email under a non-sensitive key', () => {
    const out = scrubLog({ level: 'info', attributes: { actor: 'scottj1426@gmail.com' } });
    expect(out?.attributes?.actor).toBe('s***@gmail.com');
  });

  it('leaves ordinary values alone', () => {
    const out = scrubLog({ level: 'info', attributes: { coralId: 'RF-ABCD', count: 3 } });
    expect(out?.attributes?.coralId).toBe('RF-ABCD');
    expect(out?.attributes?.count).toBe(3);
  });

  it('handles a log with no attributes', () => {
    expect(scrubLog({ level: 'info', message: 'hello' })).toEqual({
      level: 'info',
      message: 'hello',
    });
  });

  it.each(['debug', 'trace'])('drops %s logs in production', (level) => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(scrubLog({ level })).toBeNull();
  });

  it.each(['debug', 'trace'])('keeps %s logs outside production', (level) => {
    expect(scrubLog({ level })).not.toBeNull();
  });

  it('keeps error logs in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(scrubLog({ level: 'error' })).not.toBeNull();
  });

  // Current behaviour: the input object is scrubbed in place, not copied.
  it('mutates the log in place and returns the same object', () => {
    const log = { level: 'info', attributes: { token: 'abc' } };
    const out = scrubLog(log);
    expect(out).toBe(log);
    expect(log.attributes.token).toBe('[REDACTED]');
  });
});
