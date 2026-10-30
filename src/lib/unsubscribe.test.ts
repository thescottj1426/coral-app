import { describe, it, expect, beforeAll } from 'vitest';
import { unsubscribeToken, verifyUnsubscribeToken } from './unsubscribe';

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET = 'test-secret';
});

describe('unsubscribe tokens', () => {
  it('round-trips the user id', () => {
    expect(verifyUnsubscribeToken(unsubscribeToken('user-123'))).toBe('user-123');
  });

  it('rejects a token signed for a different user', () => {
    const [, sig] = unsubscribeToken('user-123').split('.');
    expect(verifyUnsubscribeToken(`user-456.${sig}`)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyUnsubscribeToken('')).toBeNull();
    expect(verifyUnsubscribeToken('no-signature')).toBeNull();
    expect(verifyUnsubscribeToken('user-123.short')).toBeNull();
  });
});
