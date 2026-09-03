import { Resend } from 'resend';
import * as log from './log';

// Update FROM once you have coralchest.com verified in Resend.
// onboarding@resend.dev is Resend's sandbox sender — it ONLY delivers to the
// address that owns the Resend account, so every other recipient is rejected.
const SANDBOX_FROM = 'onboarding@resend.dev';
const FROM = process.env.RESEND_FROM ?? SANDBOX_FROM;

// Module-level singleton — one instance for the lifetime of the server process
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type SendResult = { ok: true } | { ok: false; error: string };

// Kill switch: all outbound email is paused. Flip to false (or set
// EMAILS_ENABLED=true) to resume sending.
const EMAILS_PAUSED = process.env.EMAILS_ENABLED !== 'true';

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  // Recipients are masked throughout — enough to correlate a user, not enough
  // to leave PII sitting in a log store.
  const recipient = log.maskEmail(to);

  if (EMAILS_PAUSED) {
    log.warn('email.paused', { recipient, subject });
    return { ok: true };
  }

  if (!resend) {
    const error = 'RESEND_API_KEY is not set — no email was sent';
    log.error('email.send_failed', { recipient, subject, reason: 'missing_api_key' });
    return { ok: false, error };
  }

  if (FROM.includes(SANDBOX_FROM)) {
    log.warn('email.sandbox_sender', {
      recipient,
      from: FROM,
      detail: 'Sandbox sender only delivers to the Resend account owner. Set RESEND_FROM to a verified domain.',
    });
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    log.error('email.send_failed', {
      recipient,
      subject,
      from: FROM,
      reason: error.message ?? 'rejected',
    });
    return { ok: false, error: error.message ?? 'Resend rejected the message' };
  }

  log.event('email.sent', { recipient, subject, from: FROM });
  return { ok: true };
}
