# AutoPost — Multi-Business Instagram Scheduler

Herramienta web multiempresa para programar y publicar posts de Instagram usando **exclusivamente** la API oficial de Meta (Instagram Graph API v21.0).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Admin Frontend (App Router)                    │
│  - Login, Businesses, ZIP Upload, Posts, Logs           │
└───────────────┬─────────────────────────────────────────┘
                │ HTTP (iron-session cookie auth)
┌───────────────▼─────────────────────────────────────────┐
│  Next.js API Routes (Route Handlers)                    │
│  /api/auth, /api/businesses, /api/batches, /api/posts   │
│  /api/meta/oauth/callback, /api/logs                    │
└───────┬───────────────┬────────────────┬────────────────┘
        │               │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────────┐
│  PostgreSQL  │ │    Redis     │ │  S3-compatible       │
│  (Prisma)    │ │  (BullMQ)    │ │  Storage (MinIO/AWS) │
└──────────────┘ └──────┬──────┘ └─────────────────────┘
                        │
               ┌────────▼────────┐
               │  BullMQ Worker  │  (npm run worker)
               │  publish.worker │
               └────────┬────────┘
                        │ HTTP
               ┌────────▼────────┐
               │  Meta Graph API │
               │  v21.0          │
               └─────────────────┘
```

### Publishing Flow

1. Admin uploads ZIP → POST `/api/batches`
2. ZIP stored in S3, async parsed in background
3. Admin reviews parsed posts + errors in batch detail page
4. Admin confirms batch → POST `/api/batches/:id/confirm`
5. For each valid post: `PublishJob` created, enqueued in BullMQ with delay until `publish_at`
6. At `publish_at` time: worker picks up job, calls Meta Graph API
7. Result (success/failure) saved in DB, attempt logged
8. Admin can retry failed posts manually

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- S3-compatible storage (MinIO for local dev)

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`. Required minimum:
- `DATABASE_URL`
- `REDIS_URL`
- `STORAGE_*` variables
- `SESSION_SECRET` (generate: `openssl rand -hex 32`)
- `ENCRYPTION_KEY` (generate: `openssl rand -hex 32`)

### 3. Database Setup

```bash
npx prisma migrate deploy
npm run db:generate
npm run db:seed
```

Seed creates:
- Admin user: `admin@example.com` / `admin1234`
- Two demo businesses: `demo-brand`, `test-company`

### 4. Start Services

**Terminal 1 — Next.js:**
```bash
npm run dev
```

**Terminal 2 — BullMQ Worker:**
```bash
npm run worker
```

### 5. Demo Data

```bash
tsx scripts/create-demo-zip.ts
```

Upload `demo-data/demo-batch-2026-04.zip` via admin UI to `demo-brand`.

---

## Meta App Setup

> ⚠️ **Required external dependency.** Without a properly configured Meta App, the OAuth flow and publishing will not work.

### 1. Create a Meta App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Create new app → Type: **Business**
3. Add product: **Instagram Graph API**

### 2. Required Permissions

- `instagram_basic`
- `instagram_content_publish` ← **requires App Review** for non-test accounts
- `pages_show_list`
- `pages_read_engagement`
- `business_management`

### 3. App Review (Production)

**`instagram_content_publish` requires Meta App Review approval** before publishing to real (non-test) Instagram accounts. This:
- Requires a recorded demo of the app
- Takes 5–10 business days
- Cannot be bypassed

For dev/testing, add test users in App → Roles → Test Users.

### 4. OAuth Redirect URI

In Meta App → Facebook Login → Settings:
```
http://localhost:3000/api/meta/oauth/callback
```

### 5. Configure .env

```env
META_APP_ID="your_app_id"
META_APP_SECRET="your_app_secret"
META_REDIRECT_URI="https://yourdomain.com/api/meta/oauth/callback"
```

---

## ZIP Import Structure

```
/YYYY-MM/
  /YYYY-MM-DD_post-name/
    caption.txt          ← Required
    meta.json            ← Required
    media-01.jpg         ← image/carousel
    media-02.jpg         ← carousel (2-10 items)
    reel.mp4             ← reel
```

### meta.json

```json
{
  "publish_at": "2026-04-15T09:00:00+02:00",
  "type": "image",
  "business_slug": "mi-negocio",
  "first_comment": "",
  "location_id": ""
}
```

Types: `image`, `carousel`, `reel`

---

## Security

- Tokens encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY`)
- Tokens never exposed to frontend
- iron-session encrypted httpOnly cookie
- Zod validation on all inputs
- Path traversal prevention on filenames
- BullMQ job ID idempotency (no double-publish)
- DB optimistic lock prevents concurrent execution
- ZIP SHA-256 hash prevents re-importing same file

---

## Known External Dependencies

| Feature | Notes |
|---|---|
| `instagram_content_publish` | Meta App Review required for non-test accounts |
| Reel resumable upload | For videos >100MB, implement Meta Resumable Upload API (not included) |
| Token auto-refresh | Long-lived tokens ~60 days; implement a cron to refresh before expiry |

---

## Commands

```bash
npm run dev                          # Next.js dev
npm run worker                       # BullMQ worker
npm run db:migrate                   # Apply DB migrations
npm run db:seed                      # Seed demo data
npm run db:studio                    # Prisma Studio
npm run db:reset                     # Reset + reseed
npm run type-check                   # TypeScript check
tsx scripts/create-demo-zip.ts       # Create demo ZIP
tsx scripts/hash-password.ts <pw>    # Hash password
```