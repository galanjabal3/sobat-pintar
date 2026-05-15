# Sobat Pintar — GEMINI.md

> AI context file for Gemini CLI
> Last updated: May 2026

---

## Project Overview

**Sobat Pintar** is an AI-powered learning platform for Indonesian students (TK to SMA).
The app acts as a friendly AI study companion ("teman belajar"), not a strict tutor.
Mascot: **Sobi** — a friendly small robot, teal colored.

**Tagline:** *"Teman belajar AI untuk semua pelajar Indonesia"*

---

## Current Development Status

### Phase 1 — Jelasin Soal ✅ DONE
- Project scaffolding (Go + Next.js) — done
- Auth (register, login, JWT) — done
- Gemini integration (text explanation) — done
- Image upload + Gemini vision — done
- Level selector (TK/SD/SMP/SMA) — done
- "Jelaskan ulang" flow — done
- Explanation history — done
- Frontend UI — done
- Dev Container (VSCode + Docker) — done
- PostgreSQL + Redis running — done
- Login page live at localhost:3000 — done

### Next Focus: Phase 2 — Latihan Soal
- [ ] DB migrations (practice_sessions, questions tables)
- [ ] Practice service + Gemini question generator
- [ ] Practice handler + routes
- [ ] Frontend: subject selector, question card, answer options
- [ ] Score + result page
- [ ] Sobi encouragement after each answer

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Backend     | Go 1.22+ with Gin framework             |
| Frontend    | Next.js 14 (App Router) + TailwindCSS   |
| AI          | Google Gemini 1.5 Flash API (free tier) |
| Database    | PostgreSQL 15                           |
| Cache       | Redis 7                                 |
| Auth        | JWT (access + refresh token)            |
| Storage     | Cloudflare R2 (images, PDFs)            |
| Deploy      | Railway (backend) + Vercel (frontend)   |

---

## Running Environment

- Backend: http://localhost:8080
- Frontend: http://localhost:3000
- Dev Container: VSCode + Docker
- DB: PostgreSQL 15 (host: postgres, port: 5432, db: sobat_pintar, password: postgres123)
- Cache: Redis 7 (host: redis, port: 6379)

### How to Run
```bash
# Backend
cd /workspace/backend && go run cmd/server/main.go

# Frontend
cd /workspace/frontend && npm run dev

# Run migrations
cd /workspace/backend
for f in migrations/*.sql; do
  psql -h postgres -U postgres -d sobat_pintar -f "$f"
done
```

---

## Project Structure

```
sobat-pintar/
├── backend/
│   ├── cmd/
│   │   ├── server/main.go              # Entry point — starts HTTP server
│   │   └── migrate/main.go            # Run DB migrations (up/down)
│   ├── internal/
│   │   ├── config/
│   │   │   ├── config.go              # Load & validate env variables
│   │   │   └── database.go            # DB connection setup
│   │   ├── middleware/
│   │   │   ├── auth.go                # JWT authentication middleware
│   │   │   ├── cors.go                # CORS configuration
│   │   │   ├── logger.go              # Request logging middleware
│   │   │   ├── ratelimit.go           # Rate limiting per IP/user
│   │   │   └── recovery.go            # Panic recovery middleware
│   │   ├── handler/                   # HTTP handlers per feature
│   │   ├── service/                   # Business logic
│   │   ├── repository/                # DB queries
│   │   ├── model/                     # DB models / structs
│   │   ├── dto/                       # Request/Response DTOs
│   │   └── router/router.go           # Register all routes + middleware
│   ├── pkg/
│   │   ├── gemini/                    # Gemini API wrapper
│   │   ├── jwt/                       # JWT generate & validate
│   │   ├── redis/                     # Redis wrapper
│   │   ├── storage/                   # Cloudflare R2 wrapper
│   │   ├── logger/                    # Structured logger (zerolog)
│   │   └── validator/                 # Request body validation
│   └── migrations/                    # SQL migration files (001–015)
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/              # Login page
│   │   ├── (auth)/register/           # Register + level selector
│   │   └── (app)/                     # Main app with bottom nav
│   │       ├── dashboard/             # Home dashboard
│   │       ├── explain/               # Jelasin Soal feature
│   │       ├── practice/              # Latihan Soal feature
│   │       ├── chat/                  # Tanya Sobi feature
│   │       ├── summary/               # Rangkum Materi feature
│   │       ├── schedule/              # Jadwal Belajar feature
│   │       ├── leaderboard/           # Leaderboard
│   │       ├── badges/                # Badge collection
│   │       ├── groups/                # Study groups
│   │       └── profile/               # User profile
│   ├── components/                    # Reusable UI components
│   ├── lib/                           # API client (lib/api.ts), helpers
│   └── public/                        # Static assets (Sobi mascot, icons)
│
├── docs/                              # Documentation
├── GEMINI.md                          # This file
├── CLAUDE.md                          # Claude Code context (same content)
├── PROJECT_STRUCTURE.md               # Full folder & file blueprint
├── SETUP.md                           # Setup & running guide
└── README.md                          # Public documentation
```

---

## Coding Conventions

- Commit messages: lowercase with prefix (`feat:`, `fix:`, `refactor:`, `chore:`)
- Comments and docs: **English**
- UI text and user-facing strings: **Bahasa Indonesia**
- Prefer minimal, focused changes over large rewrites
- Single responsibility per handler/service function
- Always handle errors explicitly — no silent failures
- Use structured logging (zerolog)

### Go Naming Pattern
```go
// Handler: <Feature>Handler
// Service: <Feature>Service
// Repository: <Feature>Repository

type PracticeHandler struct {
    service PracticeService
}

func (h *PracticeHandler) StartSession(c *gin.Context) { ... }
```

### Next.js Conventions
- App Router only (no Pages Router)
- Server components by default, client components only when needed
- All API calls go through `lib/api.ts`, never directly in components

---

## API Endpoints Reference

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Phase 1 — Jelasin Soal (DONE)
```
POST   /api/v1/explain
GET    /api/v1/explain/history
DELETE /api/v1/explain/:id
POST   /api/v1/explain/:id/re-explain
```

### Phase 2 — Latihan Soal (NEXT)
```
GET    /api/v1/practice/subjects
POST   /api/v1/practice/start
POST   /api/v1/practice/:id/answer
GET    /api/v1/practice/:id/result
GET    /api/v1/practice/history
```

### Phase 3 — Tanya Sobi
```
POST   /api/v1/chat/sessions
GET    /api/v1/chat/sessions
GET    /api/v1/chat/sessions/:id
POST   /api/v1/chat/sessions/:id/messages
DELETE /api/v1/chat/sessions/:id
```

---

## Design System

### Brand Colors
```
Primary    → #02D48F  (Teal — main brand color)
Secondary  → #FACC15  (Yellow — accent, CTA buttons)
Tertiary   → #FFAC5A  (Orange — warnings, highlights)
Neutral    → #717676  (Gray — secondary text)
Background → #FFFFFF  (White)
Surface    → #F9FAFB  (Light gray — cards)
Error      → #EF4444  (Red)
Success    → #22C55E  (Green)
```

### Typography
- Headings: **Poppins**
- Body: **Plus Jakarta Sans**
- All UI text in **Bahasa Indonesia**
- Mobile-first design (375px base)

---

## Gemini Prompt Templates

### Phase 1 — Jelasin Soal
```
Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jelaskan soal berikut kepada siswa tingkat {level} dengan bahasa yang mudah dipahami.
Gunakan analogi yang sederhana jika perlu.
Jangan langsung kasih jawaban — jelaskan konsepnya dulu step by step.

Soal: {question}
```

### Phase 1 — Re-explain
```
Kamu adalah Sobi. Siswa tingkat {level} masih bingung dengan penjelasan sebelumnya.
Coba jelaskan dengan cara yang BERBEDA — gunakan analogi lain, contoh nyata dalam kehidupan sehari-hari, atau ilustrasi yang lebih sederhana.
Penjelasan sebelumnya: {previous_explanation}
Soal: {question}
```

### Phase 2 — Generate Latihan Soal
```
Kamu adalah Sobi. Buatkan {count} soal latihan mata pelajaran {subject} untuk siswa tingkat {level}.
Tingkat kesulitan: {difficulty} (mudah/sedang/sulit).
Format response HANYA JSON seperti ini, tanpa teks lain:
{
  "questions": [
    {
      "question": "teks soal",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "A",
      "explanation": "kenapa jawabannya A"
    }
  ]
}
```

### Phase 2 — Explain Wrong Answer
```
Kamu adalah Sobi yang sabar dan encouraging.
Siswa tingkat {level} menjawab {user_answer} tapi jawaban benarnya {correct_answer}.
Jelaskan dengan ramah kenapa jawabannya salah dan bagaimana cara berpikir yang benar.
Jangan bikin siswa merasa bodoh — semangati mereka.
Soal: {question}
```

### Phase 3 — Tanya Sobi (Chat)
```
Kamu adalah Sobi, teman belajar AI yang friendly, sabar, dan selalu semangat.
Kamu sedang ngobrol dengan siswa tingkat {level}.
Jawab pertanyaan mereka dengan bahasa yang sesuai usia mereka.
Kalau mereka nanya di luar pelajaran, tetap ramah tapi arahkan balik ke topik belajar.
Riwayat chat sebelumnya: {chat_history}
```

---

## Environment Variables

### Backend (.env)
```env
APP_PORT=8080
APP_ENV=development

DB_HOST=postgres
DB_PORT=5432
DB_NAME=sobat_pintar
DB_USER=postgres
DB_PASSWORD=postgres123

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

JWT_SECRET=sobat-pintar-secret-2026
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=sobat-pintar
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_NAME=Sobat Pintar
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Key Dependencies

### Backend (go.mod)
```
github.com/gin-gonic/gin
github.com/golang-jwt/jwt/v5
github.com/jackc/pgx/v5
github.com/redis/go-redis/v9
github.com/google/generative-ai-go
github.com/rs/zerolog
github.com/joho/godotenv
github.com/go-playground/validator
golang.org/x/crypto
```

### Frontend (package.json)
```
next@14, react@18, tailwindcss
zustand, axios, react-hook-form, zod
lucide-react, @radix-ui/react-*, framer-motion
```