import { createHash, randomInt } from 'crypto';

// No 0/O or 1/I: codes are read off order emails and paper tags.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^REEF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export const TRANSFER_CODE_TTL_DAYS = 30;

export function generateTransferCode(): string {
  const chunk = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `REEF-${chunk()}-${chunk()}`;
}

/** Accepts what people actually type: lowercase, spaces, missing dashes. Null if it can't be a code. */
export function normalizeTransferCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = raw.startsWith('REEF') ? raw.slice(4) : raw;
  if (body.length !== 8) return null;
  const code = `REEF-${body.slice(0, 4)}-${body.slice(4)}`;
  return CODE_RE.test(code) ? code : null;
}

export function looksLikeTransferCode(input: string): boolean {
  return /^\s*reef/i.test(input);
}

export function hashTransferCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
