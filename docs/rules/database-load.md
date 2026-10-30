# Database load rules: never keep Neon awake for nothing

## Why this file exists
Neon bills compute by the hour and only scales to zero after **5 minutes with no queries**. Anything that queries more often than that, from any tab, bot or cron, keeps the database on 24/7.

- **Sep–Oct 2026:** `NotificationBell` polled every 30s. One forgotten tab kept production awake for a month and burned the whole free-tier quota (Oct 18; site down until we paid).
- **Oct 2026:** after that fix, the homepage (`force-dynamic`), uncached coral pages and `/api/image` were still queried by crawlers about 46 times a minute. The database slept about 1 hour a day.

## Rules

### 1. No polling without asking Scott first
- Never add `setInterval`, `refetchInterval`, recursive `setTimeout`, SWR/React Query refresh intervals, or better-auth `sessionOptions.refetchInterval` that reach the database. **Ask first**, with the interval and a cost estimate.
- Default to fetching **on user action**: page load, opening a menu, submitting a form, or the tab becoming visible (`visibilitychange`).
- If live updates are truly needed, the industry-standard order of preference is:
  1. Event-driven: refetch after the user's own mutation (`revalidatePath`, `router.refresh()`).
  2. On focus or visibility only, never while the tab is hidden.
  3. Push (server-sent events, websockets, a realtime service). It's pricier to run, so discuss it first.
  4. Polling, as a last resort: only while the tab is visible, an interval of at least 60s with backoff, stop after inactivity, and **ask first**.

### 2. Public pages are cached, never per-request, never on a timer
- Pages anyone can reach (home, `/explore`, `/coral/[rfCode]`, anything in the sitemap) get crawled constantly. Use `export const revalidate = false`, never `force-dynamic` and never a number.
- **Oct 2026:** with `revalidate = 3600`, crawlers triggered a rebuild every 61 minutes, which woke Neon about 24 times a day (about 2h of compute) with nothing changed.
- Dynamic routes also need `generateStaticParams` (return `[]`). Otherwise Next renders them per request.
- Every mutation that changes public content (corals, lineage, approved photos) calls `revalidatePath('/', 'layout')`. That is the only way those pages refresh, so a missed call means stale pages until the next one.
- Check `npm run build`: public routes must show `○` or `●`, not `ƒ`.

### 3. Hot routes don't query per request
- Routes hit once per image, avatar or asset (`/api/image`) must let the CDN cache them (`s-maxage`) and skip session and user lookups unless they're actually needed.
- No database queries in `proxy.ts` (middleware). It runs on every request.

### 4. No background jobs without asking
- Crons, uptime monitors pointed at database-backed pages, Vercel cron and scheduled functions all need Scott's OK first. Point health checks at a static route.

### 5. Verify after shipping
- After deploying anything that touches data fetching, check Neon a few hours later. The compute should be suspended most of the day.
- Quick check from the Neon MCP: `describe_project` (`active_time_seconds` versus the time since the period started) and `pg_stat_user_tables` (scan counts per table since the compute started).
