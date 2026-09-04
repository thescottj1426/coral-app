import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { siteUrl } from './siteUrl';

const FALLBACK = 'https://coral-app-one.vercel.app';

describe('siteUrl', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL;
  });

  afterEach(() => {
    process.env = original;
  });

  it('returns a configured non-local url', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://polyp.app';
    expect(siteUrl()).toBe('https://polyp.app');
  });

  it('strips a trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://polyp.app/';
    expect(siteUrl()).toBe('https://polyp.app');
  });

  it('keeps a localhost url when not on Vercel', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    expect(siteUrl()).toBe('http://localhost:3000');
  });

  // The whole point of the module: a localhost URL must never reach a sitemap.
  it.each([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    'https://localhost',
  ])('ignores local url %s when on Vercel', (local) => {
    process.env.VERCEL = '1';
    process.env.NEXT_PUBLIC_APP_URL = local;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'polyp.vercel.app';
    expect(siteUrl()).toBe('https://polyp.vercel.app');
  });

  it('falls back when on Vercel with a local url and no production domain', () => {
    process.env.VERCEL = '1';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    expect(siteUrl()).toBe(FALLBACK);
  });

  it('uses the Vercel production domain when nothing is configured', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'polyp.vercel.app';
    expect(siteUrl()).toBe('https://polyp.vercel.app');
  });

  it('strips a trailing slash from the Vercel domain', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'polyp.vercel.app/';
    expect(siteUrl()).toBe('https://polyp.vercel.app');
  });

  it('falls back when nothing is configured', () => {
    expect(siteUrl()).toBe(FALLBACK);
  });

  it('ignores a whitespace-only configured url', () => {
    process.env.NEXT_PUBLIC_APP_URL = '   ';
    expect(siteUrl()).toBe(FALLBACK);
  });
});
