import { pool } from '@/lib/db';

// Avoids ambiguous chars (0/O, 1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRFCode(): string {
  return 'RF-' + Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export async function uniqueRFCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRFCode();
    const { rows } = await pool.query('SELECT 1 FROM public."Coral" WHERE "rfCode" = $1', [code]);
    if (rows.length === 0) return code;
  }
  throw new Error('Could not generate a unique RF code after 10 attempts');
}
