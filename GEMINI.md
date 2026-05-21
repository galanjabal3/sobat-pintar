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
- Local development setup — done

### Phase 2 — Latihan Soal ✅ DONE
- DB migrations (practice_sessions, questions tables) — done
- Practice service + Gemini question generator — done
- Practice handler + routes — done
- Frontend: subject selector, question card, answer options — done
- Score + result page — done
- Sobi encouragement after each answer — done

### Phase 3 — Tanya Sobi ✅ DONE
- DB migrations (chat_sessions, messages) — done
- Chat service with conversation context — done
- Frontend: Chat page + messages UI — done
- Chat history management — done

### Phase 4 — Rangkum Materi ✅ DONE FOR TEXT
- Text summary service + Gemini — done
- History and detailed view — done
- Frontend: Summary text input & result pages — done
- PDF/image text extraction — not implemented yet

### Phase 5 — Jadwal Belajar ✅ DONE
- AI-generated study schedule logic — done
- Subject input and exam date management — done
- Frontend: Schedule generator and view pages — done

### Phase 6 — Gamification ✅ DONE
- Points system and streak tracking — done
- Badge unlock logic and leaderboard — done
- Frontend: Points display, badges, leaderboard UI — done

### Phase 7 — Kolaborasi 🚧 SCAFFOLDED
- Study group models, DTOs, migrations, and UI placeholder/components — scaffolded
- Backend group service/repository methods currently return placeholders
- Group routes are not registered in the active server router

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Backend     | Go 1.26.3 with Gin framework            |
| Frontend    | Next.js 14 (App Router) + TailwindCSS   |
| AI          | Google Gemini API                        |
| Database    | Supabase PostgreSQL                     |
| Cache       | Redis helper package, not wired into active runtime |
| Auth        | JWT (access + refresh token)            |
| Storage     | Cloudinary active for images; R2 scaffolded |
| Deploy      | Railway (backend) + Vercel (frontend)   |

---

## Running Environment

- Backend: http://localhost:8080
- Frontend: http://localhost:3000
- Backend: Go server running directly on the local machine
- DB: Supabase PostgreSQL through `DATABASE_URL`
- Cache: Redis helper package exists, default disabled with `REDIS_ENABLED=false`

### How to Run
```bash
# Backend
cd backend && go run cmd/server/main.go

# Frontend
cd frontend && npm run dev

# Run migrations
cd backend && go run cmd/migrate/main.go up
```

---

## Project Structure

```
sobat-pintar/
├── backend/
│   ├── cmd/
│   │   ├── server/main.go              # Entry point
│   │   └── migrate/main.go            # Run DB migrations
│   ├── internal/
│   │   ├── handler/                   # HTTP handlers (auth, explain, practice, chat, summary, schedule, gamify, group)
│   │   ├── service/                   # Business logic
│   │   ├── repository/                # DB queries
│   │   ├── model/                     # DB models
│   │   ├── dto/                       # Request/Response DTOs
│   │   └── router/router.go           # Route registration
│   ├── pkg/
│   │   ├── gemini/                    # Gemini SDK wrapper
│   │   ├── jwt/                       # JWT logic
│   │   ├── redis/                     # Redis helper package
│   │   ├── storage/                   # Cloudflare R2 placeholder
│   │   ├── cloudinary/                # Cloudinary wrapper
│   │   └── logger/                    # Structured logger (zerolog)
│   └── migrations/                    # SQL files (001–021)
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/                    # Login & Register
│   │   └── (app)/                     # Dashboard, Explain, Practice, Chat, Summary, Schedule, Leaderboard, Badges, Groups, Profile
│   ├── components/                    # UI components per feature
│   ├── lib/                           # API client & utils
│   └── store/                         # Zustand stores (auth, toast)
```

---

## API Endpoints Reference

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google
POST /api/v1/auth/refresh
GET  /api/v1/user/profile
PATCH /api/v1/user/profile
```

### Jelasin Soal
```
POST   /api/v1/explain
GET    /api/v1/explain/history
GET    /api/v1/explain/:id
POST   /api/v1/explain/:id/re-explain
GET    /api/v1/public/explain/:id
```

### Latihan Soal
```
POST   /api/v1/practice/start
GET    /api/v1/practice/sessions/:id
POST   /api/v1/practice/questions/:id/answer
POST   /api/v1/practice/sessions/:id/finish
GET    /api/v1/practice/sessions/:id/result
GET    /api/v1/practice/history
GET    /api/v1/practice/progress
```

### Tanya Sobi (Chat)
```
POST   /api/v1/chat/sessions
GET    /api/v1/chat/sessions
GET    /api/v1/chat/sessions/:id
POST   /api/v1/chat/sessions/:id/messages
DELETE /api/v1/chat/sessions/:id
```

### Rangkum Materi (Summary)
```
POST   /api/v1/summary
GET    /api/v1/summary/:id
GET    /api/v1/summary/history
DELETE /api/v1/summary/:id
GET    /api/v1/public/summary/:id
```

### Jadwal Belajar (Schedule)
```
POST   /api/v1/schedule/generate
GET    /api/v1/schedule
```

### Gamification
```
GET    /api/v1/gamification/points
GET    /api/v1/gamification/badges
GET    /api/v1/gamification/leaderboard
```

### Upload
```
POST   /api/v1/upload/profile
POST   /api/v1/upload/posts
POST   /api/v1/upload/attachments
```

### Collaboration (Groups, not registered yet)
```
POST   /api/v1/groups
GET    /api/v1/groups
```

---

## Design System

- **Primary**: #02D48F (Teal)
- **Secondary**: #FACC15 (Yellow)
- **Tertiary**: #FFAC5A (Orange)
- **Neutral**: #717676 (Gray)
- **Background**: #FFFFFF (White)

---

## Gemini Prompt Templates
(See backend/pkg/gemini for implementation details)
