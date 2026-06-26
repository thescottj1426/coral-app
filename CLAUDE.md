@AGENTS.md

# Polyp — Claude working rules

**App:** Polyp — coral collection, lineage tracing, object-anchored community discussions.
**Repo:** `c:\Users\scott\workspace\coral-dex` · Solo project, owner: Scott (scottj1426@gmail.com)

---

## Stack — critical gotchas

| Layer | Detail |
|---|---|
| **Next.js 16 App Router** | `params` is `Promise<{...}>` — always `await params`. Pages reading live DB data need `export const dynamic = 'force-dynamic'`. |
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
- Anchor-type colors: `anchorTile(hue)` / `anchorInk(hue)` / `anchorWash(hue)` from `@/lib/anchorTypes.ts`

Before building any new UI screen, pull the design spec:
```
claude_design MCP → get_file → project 019e21a9-dcba-74c4-bf57-7860ae97235d
```

---

## File map

```
src/app/(auth)/              sign-in, sign-up
src/app/(dashboard)/         all authenticated pages
src/app/actions/             server actions — discussions.ts, specimens.ts, …
src/app/api/                 image proxy (/api/image), auth routes
src/components/
  discussion/                DiscussHub, DiscussionBoard, ThreadComposer, AnchorCard, ReplyItem, …
  shell/                     AppNav, AppShell wrapper
src/lib/
  anchorTypes.ts             AnchorType union, ANCHOR_TYPE_CONFIG, anchorTile/Ink/Wash
  auth.ts                    better-auth instance
  db.ts                      Neon pool
src/theme/theme.ts           Mantine theme, category colors, identity gradient
```

---

## Discussion system (built)

6 anchor types: `specimen | line | species | photo | listing | log`  
Thread table columns: `anchorType TEXT`, `anchorId TEXT` (coral UUID for specimen; free-text name for all others — display uses `COALESCE(c.name, t."anchorId")`).  
Routes: `/discuss`, `/collection/[id]/discussion/[threadId]`

---

## Communication rules

- **No preamble.** Never open with "Certainly!", "Great question!", or a summary of what you're about to do.
- **List routes after every feature.** End implementation summaries with the live URLs: `http://localhost:3000/...`
- **Terse.** One sentence per status update. Match response length to task complexity — a simple fix gets one sentence, not five paragraphs.
- **Don't over-engineer.** No abstractions beyond the task. No error handling for impossible cases. No backwards-compat shims.
- **No code comments** unless the WHY is non-obvious (hidden constraint, workaround for a specific bug).
- **Don't kill processes** without explicit user permission.
