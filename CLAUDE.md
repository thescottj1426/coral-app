@AGENTS.md
@docs/rules/database-load.md

# Coral Chest — Claude working rules

**App:** Coral Chest (formerly Polyp) — coral collection, lineage tracing, transfer codes that move a frag into its buyer's collection with its history.
**Repo:** `c:\Users\scott\workspace\coral-dex` · Solo project, owner: Scott (scottj1426@gmail.com)

---

## Stack — critical gotchas

| Layer | Detail |
|---|---|
| **Next.js 16 App Router** | `params` is `Promise<{...}>` — always `await params`. Signed-in pages reading per-user data use `export const dynamic = 'force-dynamic'`. **Public pages never do**: they use `revalidate = false` (+ `generateStaticParams` returning `[]` on dynamic routes), refreshed by `revalidatePath('/', 'layout')` in mutations. See `docs/rules/database-load.md`. |
| **React 19** | Cannot pass functions as props from Server → Client. Use `<Link href="..."><Button component="a">` pattern instead of `Button component={Link}`. |
| **Mantine v9** | CSS vars are `--mantine-color-ocean-6` etc. Layout via `Paper withBorder`, `Stack`, `Group`. No Tailwind ever. |
| **Neon Postgres** | Raw SQL only — `pool.query<T>()` from `@/lib/db`. No Prisma. All mutations in `src/app/actions/` as `'use server'` functions. |
| **Neon Auth** | `better-auth` — session via `auth.api.getSession({ headers: await headers() })` |
| **S3 photos** | Presigned upload via `@/lib/s3`. Images served via `/api/image?key=...` |

---

## Design system

**Direction: Reef Lab** — primary `ocean` (#2f66cc), heading font Sora, radius `md`.

- Theme + helpers: `src/theme/theme.ts` — `CATEGORY_COLORS`, `coralIdentityGradient(seed)`
- CSS vars: `--mantine-color-ocean-0` … `9`, `--mantine-primary-color-filled`
- **Custom styles go in CSS modules** (`*.module.css`) — never a blob of inline styles for anything reused

Before building any new UI screen, pull the design spec:
```
claude_design MCP → get_file → project 019e21a9-dcba-74c4-bf57-7860ae97235d
```

---

## File map

```
src/app/(auth)/              sign-in, sign-up, onboarding, password reset
src/app/(dashboard)/         authenticated pages — collection, claim, feed, explore, search, users
src/app/(public)/            cached public pages — /coral/[rfCode], /explore
src/app/(admin)/admin/       photo queue, reports, email users
src/app/actions/             server actions — specimens, lineage, admin, users, feed, notifications, listings
src/app/api/                 image proxy (/api/image), upload, og image, health, unsubscribe, auth
src/components/
  coral/ specimen/ profile/  coral cards, add/edit forms, profile pieces
  shell/                     AppHeader, AppShellWrapper, NotificationBell
src/lib/
  auth.ts                    better-auth instance
  db.ts                      Neon pool
  email.ts emailTemplates.ts Resend sender (off unless EMAILS_ENABLED=true) and templates
  rfCode.ts                  public RF codes (4 chars, NOT secret — never use as a claim credential)
src/theme/theme.ts           Mantine theme, category colors, identity gradient
scripts/migrate-*.mjs        idempotent migrations — run on a Neon branch first
```

---

## What exists

- **Lineage:** `Lineage(parentId, childId)`; frags are cut with `createFrags` and stay `ownerId` NULL until claimed by RF code.
- **Comments:** per-coral comments (`CommentSection`). There is no thread/discussion system — `/discuss` does not exist.
- **Ownership history:** `CoralOwnershipEvent`, append-only.

---

## Communication rules

- **No preamble.** Never open with "Certainly!", "Great question!", or a summary of what you're about to do.
- **List routes after every feature.** End implementation summaries with the live URLs: `http://localhost:3000/...`
- **Terse.** One sentence per status update. Match response length to task complexity — a simple fix gets one sentence, not five paragraphs.
- **Don't over-engineer.** No abstractions beyond the task. No error handling for impossible cases. No backwards-compat shims.
- **No code comments** unless the WHY is non-obvious (hidden constraint, workaround for a specific bug).
- **Don't kill processes** without explicit user permission.
