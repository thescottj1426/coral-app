// Static on purpose: uptime monitors hit this every few minutes, and a database
// check here would keep Neon awake 24/7 (docs/rules/database-load.md).
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ ok: true });
}
