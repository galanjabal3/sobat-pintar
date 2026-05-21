# Sobat Pintar — Project Structure

> Reference for the current local-development layout.

---

## Root

```
sobat-pintar/
├── backend/                  # Go + Gin REST API
├── frontend/                 # Next.js 14 app
├── README.md                 # Project overview
├── SETUP.md                  # Local setup guide
├── PROJECT_STRUCTURE.md      # This file
├── GEMINI.md                 # AI context file for Gemini
├── CLAUDE.md                 # AI context file for Claude
└── .gitignore
```

Development runs locally. The backend connects to Supabase PostgreSQL through `DATABASE_URL`; Redis exists as a helper package but is not wired into the current active runtime.

---

## Backend

```
backend/
├── cmd/
│   ├── server/main.go        # HTTP server entry point
│   └── migrate/main.go       # SQL migration runner
├── internal/
│   ├── config/               # Env loading and database connection
│   ├── dto/                  # Request/response DTOs
│   ├── handler/              # Gin HTTP handlers
│   ├── middleware/           # Auth, CORS, logging, recovery
│   ├── model/                # Domain/database models
│   ├── repository/           # PostgreSQL queries
│   ├── router/               # Route registration
│   └── service/              # Business logic
├── migrations/               # SQL migrations 001-021
├── pkg/
│   ├── cloudinary/           # Cloudinary upload client
│   ├── fcm/                  # Firebase Cloud Messaging helpers
│   ├── gemini/               # Gemini API wrapper and prompts
│   ├── jwt/                  # JWT generation and validation
│   ├── logger/               # zerolog setup
│   ├── redis/                # Optional Redis helpers
│   ├── storage/              # Placeholder storage helpers
│   └── validator/            # Request validation helpers
├── .env.example              # Backend env template
├── go.mod
└── go.sum
```

Important backend env:

```env
DATABASE_URL=postgresql://postgres.gtetgsxhrlxrammwrmgx:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Frontend

```
frontend/
├── app/                      # Next.js App Router pages/layouts
├── components/               # UI and feature components
├── lib/                      # API client and utilities
├── services/                 # API service wrappers
├── store/                    # Zustand stores
├── types/                    # TypeScript types
├── .env.local.example        # Frontend env template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

Important frontend env:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Local Commands

Backend:

```bash
cd backend
go run cmd/migrate/main.go up
go run cmd/server/main.go
```

Frontend:

```bash
cd frontend
npm run dev
```

Checks:

```bash
cd backend && go test ./...
cd frontend && npx tsc --noEmit
```

Current implementation notes:

- Collaboration/group files and database tables exist, but the group service/repository methods are placeholders and the group routes are not registered in the active router.
- Summary currently supports text input. PDF/image text extraction is not implemented yet.
- Redis, Cloudflare R2, and Firebase Cloud Messaging packages are placeholders/helpers. Active image upload uses Cloudinary when credentials are configured.
