const BASE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8f9fa;
  margin: 0; padding: 40px 0;
`;
const CARD = `
  background: #ffffff;
  max-width: 520px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
`;
const HEADER = `
  background: linear-gradient(135deg, oklch(0.76 0.11 200), oklch(0.5 0.13 220));
  padding: 28px 32px;
`;
const BODY = `padding: 28px 32px;`;
const BTN = `
  display: inline-block;
  background: #1b3a78;
  color: #ffffff !important;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  margin: 16px 0;
`;
const FOOTER = `
  padding: 16px 32px;
  border-top: 1px solid #f1f3f5;
  font-size: 12px;
  color: #868e96;
`;

function shell(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="${BASE}">
<div style="${CARD}">
  <div style="${HEADER}">
    <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px;">polyp</span>
  </div>
  <div style="${BODY}">
    <h2 style="margin:0 0 8px;font-size:20px;color:#212529;">${title}</h2>
    ${body}
  </div>
  <div style="${FOOTER}">
    You received this because you have a Polyp account. If you didn't request this, you can safely ignore it.
  </div>
</div>
</body></html>`;
}

export function verifyTemplate(url: string) {
  return shell('Verify your email', `
    <p style="color:#495057;margin:0 0 20px;line-height:1.6;">
      Click the button below to confirm your email address and activate your Polyp account.
    </p>
    <a href="${url}" style="${BTN}">Verify email</a>
    <p style="color:#868e96;font-size:12px;margin:16px 0 0;">
      Or copy this link: <a href="${url}" style="color:#1b3a78;">${url}</a>
    </p>
  `);
}

export function resetTemplate(url: string) {
  return shell('Reset your password', `
    <p style="color:#495057;margin:0 0 20px;line-height:1.6;">
      Someone requested a password reset for your Polyp account. Click below to choose a new password.
      This link expires in 1 hour.
    </p>
    <a href="${url}" style="${BTN}">Reset password</a>
    <p style="color:#868e96;font-size:12px;margin:16px 0 0;">
      Or copy this link: <a href="${url}" style="color:#1b3a78;">${url}</a>
    </p>
  `);
}

export function welcomeTemplate(username: string) {
  return shell(`Welcome to Polyp, @${username}`, `
    <p style="color:#495057;margin:0 0 20px;line-height:1.6;">
      Your first specimen is in the collection. Every coral has a story — this is yours to trace.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/collection" style="${BTN}">View my collection</a>
  `);
}
