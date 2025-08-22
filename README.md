# MakerPulse (Manager → Maker)

Monorepo scaffold (phase 1 web app) with Next.js App Router, Clerk auth, Prisma (Supabase Postgres), and API routes for device init and ingest.

## Apps
- `apps/web`: Next.js app

## Environment variables (Vercel)

Required for web:

- `DATABASE_URL` — Supabase pooled connection string
- `DIRECT_URL` — Supabase direct connection (optional, for migrations)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_SIGN_IN_URL=/sign-in`
- `CLERK_SIGN_UP_URL=/sign-up`
- `CLERK_AFTER_SIGN_IN_URL=/`
- `CLERK_AFTER_SIGN_UP_URL=/`
- `NEXT_PUBLIC_BASE_URL` — e.g., `https://your-domain`

Optional:
- `CRON_SECRET` — protect scheduled routes

## Local development

```bash
cd apps/web
npm install
npm run dev
```

## Prisma

```bash
cd apps/web
npx prisma generate
# After setting DATABASE_URL to Supabase, run migrations
npx prisma migrate deploy
```

## API
- `POST /api/devices/init` — returns `{ deviceKey, ingestUrl }` for the extension
- `POST /api/ingest` — accepts events with header `x-device-key`
- `GET /api/health` — health check
