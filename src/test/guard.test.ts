import { describe, it, expect } from 'vitest';
import { assertDisposableDatabase } from './guard';

const base = '.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const url = (endpoint: string) => `postgresql://u:p@${endpoint}${base}`;

const STAGING = 'ep-silent-credit-aiklv788';
const PRODUCTION = 'ep-calm-heart-airbkkvd';
const THROWAWAY = 'ep-test-branch-a1b2c3d4';

describe('assertDisposableDatabase', () => {
  it('accepts a throwaway branch', () => {
    expect(assertDisposableDatabase(url(THROWAWAY))).toBe(url(THROWAWAY));
  });

  it('refuses when unset', () => {
    expect(() => assertDisposableDatabase(undefined)).toThrow(/not set/);
  });

  it('refuses an empty string', () => {
    expect(() => assertDisposableDatabase('')).toThrow(/not set/);
  });

  it('refuses a malformed url', () => {
    expect(() => assertDisposableDatabase('not-a-url')).toThrow(/not a valid URL/);
  });

  it.each([
    ['production', PRODUCTION],
    ['staging', STAGING],
    ['staging backup', 'ep-damp-dream-aino7tf9'],
    ['QA', 'ep-proud-cloud-aic4x578'],
  ])('refuses the %s endpoint', (_label, endpoint) => {
    expect(() => assertDisposableDatabase(url(endpoint))).toThrow(/protected endpoint/);
  });

  // A pooled host is the same compute as its direct host — the suffix must not
  // let a protected branch slip past.
  it('refuses a protected endpoint via its pooler host', () => {
    expect(() => assertDisposableDatabase(url(`${PRODUCTION}-pooler`))).toThrow(
      /protected endpoint/
    );
  });

  it('refuses the endpoint .env.local points at', () => {
    // .env.local currently targets staging, which is also on the protected list;
    // either guard firing is a refusal, which is what matters here.
    expect(() => assertDisposableDatabase(url(STAGING))).toThrow();
  });
});
