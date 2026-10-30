import { createHmac, timingSafeEqual } from 'crypto';

// Signed instead of stored: the link only has to prove which user it was sent
// to, and a signature needs no token column or lookup table.
function sign(userId: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');
  return createHmac('sha256', `unsubscribe:${secret}`).update(userId).digest('base64url');
}

export function unsubscribeToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}
