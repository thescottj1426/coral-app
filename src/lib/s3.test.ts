import { describe, it, expect } from 'vitest';
import { imageProxyUrl } from './s3';

describe('imageProxyUrl', () => {
  it('points at the image proxy', () => {
    expect(imageProxyUrl('specimens/u1/abc.jpg')).toBe(
      '/api/image?key=specimens%2Fu1%2Fabc.jpg'
    );
  });

  // The whole bug: the predecessor returned a direct bucket URL, the bucket is
  // private, and every frag photo rendered blank.
  it('never emits a direct S3 url', () => {
    expect(imageProxyUrl('specimens/u1/abc.jpg')).not.toContain('amazonaws.com');
  });

  it('is a relative url, so it works on any deployment origin', () => {
    expect(imageProxyUrl('k')).toMatch(/^\/api\/image\?key=/);
  });

  it.each([
    ['a b.jpg', 'a%20b.jpg'],
    ['a+b.jpg', 'a%2Bb.jpg'],
    ['a&b.jpg', 'a%26b.jpg'],
    ['a?b.jpg', 'a%3Fb.jpg'],
  ])('encodes %s so the query string survives', (key, encoded) => {
    expect(imageProxyUrl(key)).toBe(`/api/image?key=${encoded}`);
  });
});
