import { Resend } from 'resend';

// Update FROM once you have coralchest.com verified in Resend.
// Until then, use onboarding@resend.dev for testing (sends only to your Resend account email).
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

// Module-level singleton — one instance for the lifetime of the server process
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping send to', to);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error('[email] Resend error:', error);
}
