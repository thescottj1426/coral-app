import { Resend } from 'resend';

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

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    const error = 'RESEND_API_KEY is not set — no email was sent';
    console.error(`[email] FAILED to ${to} ("${subject}"): ${error}`);
    return { ok: false, error };
  }

  if (FROM.includes(SANDBOX_FROM)) {
    console.warn(
      `[email] FROM is the Resend sandbox sender (${FROM}). Delivery to ${to} will be ` +
      `rejected unless it owns the Resend account. Set RESEND_FROM to a verified domain.`
    );
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error(`[email] FAILED to ${to} from ${FROM} ("${subject}"):`, error);
    return { ok: false, error: error.message ?? 'Resend rejected the message' };
  }

  console.log(`[email] sent to ${to} from ${FROM} ("${subject}")`);
  return { ok: true };
}
