# Sobat Pintar — Local Setup Guide

> Development now runs directly on the local machine.
> Backend uses Supabase PostgreSQL through `DATABASE_URL`.

---

## Prerequisites

- Go 1.26.3
- Node.js 20+
- Supabase project
- Gemini API key
- Redis 7 is not required for the current active runtime

---

## Backend Environment

Create the backend env file:

```bash
cd backend
cp .env.example .env
```

Set these values in `backend/.env`:

```env
APP_PORT=8080
APP_ENV=development

DATABASE_URL=postgresql://postgres.gtetgsxhrlxrammwrmgx:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require

REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

JWT_SECRET=replace_with_a_long_random_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=
```

Notes:

- Replace `[YOUR-PASSWORD]` with the database password from Supabase.
- URL-encode the password if it contains special characters such as `@`, `:`, `/`, `?`, `#`, or `%`.
- Keep `?sslmode=require` in the Supabase connection string.
- Do not commit `backend/.env`.
- The old `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_SSL_MODE` variables are still supported only as a fallback when `DATABASE_URL` is empty.

---

## Supabase Setup

1. Create a Supabase project.
2. Choose the closest Asia-Pacific region available.
3. Disable Data API exposure if this app only connects through the Go backend.
4. Keep the default Postgres type.
5. Copy the PostgreSQL connection string from the Supabase Connect panel.
6. Use the Session Pooler connection string for local backend development.
7. Paste it into `DATABASE_URL` and add `?sslmode=require` if it is missing.

Run migrations from the backend folder:

```bash
cd backend
go run cmd/migrate/main.go up
```

The migration command uses the same `DATABASE_URL` as the backend server.

---

## Run Locally

Install and start the backend:

```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

Backend runs at:

```text
http://localhost:8080
```

Install and start the frontend:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

`frontend/.env.local` should include:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Redis

Redis is disabled by default and is not wired into the current active runtime.

Keep Redis disabled locally unless you intentionally start wiring Redis-backed features:

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

If Redis-backed features are added later, start Redis locally with your preferred package manager. On macOS with Homebrew:

```bash
brew services start redis
redis-cli ping
```

Expected response:

```text
PONG
```

---

## Checks

Backend:

```bash
cd backend
go test ./...
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

If `npm run build` fails while fetching Google Fonts, verify network access to `fonts.googleapis.com`.

---

## Troubleshooting

### Supabase connection fails

- Confirm the database password is correct.
- Confirm `?sslmode=require` is present.
- Confirm the connection string uses the pooler host from Supabase.
- Check whether your network blocks outbound PostgreSQL connections.

### Migrations fail after a partial run

- Use a fresh Supabase project while setting up the first time, or manually inspect the partially created tables in Supabase SQL Editor.
- Most migrations use `CREATE TABLE IF NOT EXISTS`, but some `ALTER TABLE` migrations still depend on previous tables existing.

### Frontend cannot call backend

- Confirm backend is running on `localhost:8080`.
- Confirm `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` in `frontend/.env.local`.
