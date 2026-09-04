import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authBaseUrl, googleConfigured } from './authUrl';

const PRODUCTION = 'https://coral-app-one.vercel.app';
const LOCAL = 'http://localhost:3000';

describe('authBaseUrl', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
    delete process.env.BETTER_AUTH_URL;
  });

  afterEach(() => {
    process.env = original;
  });

  it('uses the production domain in production', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.BETTER_AUTH_URL = LOCAL;
    expect(authBaseUrl()).toBe(PRODUCTION);
  });

  // The whole point: a preview must send Google back to itself, or the user
  // lands on production mid-sign-in.
  it('uses the deployment url on a preview, not the production domain', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'coral-abc123-scott.vercel.app';
    expect(authBaseUrl()).toBe('https://coral-abc123-scott.vercel.app');
  });

  it('falls back to the configured url when a preview reports no url', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    process.env.BETTER_AUTH_URL = 'https://staging.example.com';
    expect(authBaseUrl()).toBe('https://staging.example.com');
  });

  it('uses localhost when not on Vercel at all', () => {
    expect(authBaseUrl()).toBe(LOCAL);
  });

  it('honours a configured url locally', () => {
    process.env.BETTER_AUTH_URL = 'http://localhost:4000';
    expect(authBaseUrl()).toBe('http://localhost:4000');
  });

  // The sitemap bug, in its new home: a localhost value pasted into Vercel.
  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'https://0.0.0.0'])(
    'ignores local url %s when on Vercel',
    (url) => {
      process.env.VERCEL = '1';
      process.env.BETTER_AUTH_URL = url;
      expect(authBaseUrl()).toBe(LOCAL);
    }
  );

  it('strips a trailing slash', () => {
    process.env.BETTER_AUTH_URL = 'https://polyp.app/';
    expect(authBaseUrl()).toBe('https://polyp.app');
  });
});

describe('googleConfigured', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env = original;
  });

  it('is true only when both credentials are present', () => {
    process.env.GOOGLE_CLIENT_ID = 'id';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    expect(googleConfigured()).toBe(true);
  });

  it('is false when the id is missing', () => {
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    expect(googleConfigured()).toBe(false);
  });

  it('is false when the secret is missing', () => {
    process.env.GOOGLE_CLIENT_ID = 'id';
    expect(googleConfigured()).toBe(false);
  });

  // `?? ''` treated this as configured, which is how the button came to exist
  // while being unable to work.
  it('is false when a credential is blank', () => {
    process.env.GOOGLE_CLIENT_ID = '   ';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    expect(googleConfigured()).toBe(false);
  });

  it('is false when neither is set', () => {
    expect(googleConfigured()).toBe(false);
  });
});
