# Polyp — Command Reference

## Dev server

```bash
npm run dev          # start on http://localhost:3000
npm run build        # production build (catches TS errors)
npm run lint         # lint check
```

> After changing `next.config.ts`, stop and restart the dev server — hot reload won't pick it up.

---

## Database (Neon)

You don't use a migration file — raw SQL runs directly against Neon.

**Option A — Neon console (easiest)**
1. https://console.neon.tech → your project → **SQL Editor**
2. Paste and run your SQL

**Option B — psql**
```bash
# connection string is in .env.local as DATABASE_URL
psql $DATABASE_URL
```

**Common schema changes:**
```sql
-- add a column
ALTER TABLE public."Thread" ADD COLUMN IF NOT EXISTS "photoKey" TEXT;

-- check what columns a table has
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'Thread' ORDER BY ordinal_position;

-- list all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Git

```bash
git status                   # what's changed
git add -A                   # stage everything
git commit -m "message"      # commit
git push                     # push to GitHub (thescottj1426/coral-app)
git log --oneline -10        # recent commits
git diff                     # unstaged changes
git diff --staged            # staged changes
```

---

## AWS S3

Photos upload via the app at `/api/upload` — you don't need to touch S3 directly.

If you need to check what's in the bucket:
1. AWS Console → S3 → `coral-photos-and-more`
2. Files live under `specimens/{userId}/{uuid}.ext`
3. Threads will use the same bucket (same path for now)

IAM user needs both `s3:PutObject` and `s3:GetObject` on `arn:aws:s3:::coral-photos-and-more/*`.

---

## Routes

| URL | What it is |
|-----|-----------|
| `/dashboard` | Home dashboard (claim widget, KPI, tanks) |
| `/collection` | Your coral collection |
| `/collection/[rfCode]` | Single coral detail |
| `/discuss` | All community threads |
| `/explore` | Browse all collectors |
| `/claim` | Claim a frag by RF code |
| `/u/[handle]` | Public profile |
| `/sign-in` / `/sign-up` | Auth |
| `/api/image?key=...` | Image proxy (never load S3 URLs directly) |
| `/api/upload` | Photo upload endpoint |
| `/api/me` | Returns `{ username, isAdmin }` for current session |
