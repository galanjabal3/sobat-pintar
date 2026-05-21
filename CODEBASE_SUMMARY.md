# Sobat Pintar Codebase Summary

Last reviewed: May 21, 2026

## Product Context

Sobat Pintar is an AI-powered learning platform for Indonesian students from TK to SMA. The product voice is a friendly study companion, not a strict tutor. The main mascot is Sobi, a small teal robot used across onboarding, chat, explanation, practice, empty states, and result screens.

Core positioning:

- Tagline: "Teman belajar AI untuk semua pelajar Indonesia"
- UI language: Bahasa Indonesia
- Technical comments and documentation: English
- Design direction: mobile-first, 375px base, friendly and student-oriented
- Brand color: `#02D48F`

## Stack

Backend:

- Go `1.26.3`
- Gin HTTP framework
- PostgreSQL through Supabase-compatible `DATABASE_URL`
- `pgx/v5` connection pool
- Google Gemini through `google.golang.org/genai`
- JWT access and refresh tokens
- `zerolog` structured logging
- Cloudinary for active image uploads
- Redis, Cloudflare R2, and Firebase Cloud Messaging packages exist, but are not fully active product features yet

Frontend:

- Next.js 14 App Router
- React 18
- TypeScript
- TailwindCSS
- Zustand for auth and toast state
- Axios API client with token injection and refresh-token retry
- Framer Motion for UI animation
- React Markdown for AI response rendering
- Lucide React icons

## Repository Layout

Root documents:

- `README.md`: product, setup, API, roadmap
- `SETUP.md`: local setup with Supabase/PostgreSQL
- `PROJECT_STRUCTURE.md`: current folder layout and implementation notes
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`: AI assistant context files

Backend layout:

- `backend/cmd/server/main.go`: server wiring and graceful shutdown
- `backend/cmd/migrate/main.go`: simple sorted SQL migration runner
- `backend/internal/router`: Gin route registration
- `backend/internal/handler`: HTTP handlers
- `backend/internal/service`: business logic
- `backend/internal/repository`: PostgreSQL queries
- `backend/internal/model`: database/domain models
- `backend/internal/dto`: request/response shapes
- `backend/internal/middleware`: auth, CORS, logging, recovery, placeholder rate limit
- `backend/pkg/gemini`: AI prompts and Gemini wrappers
- `backend/pkg/cloudinary`: active Cloudinary upload client
- `backend/pkg/storage`: Cloudflare R2 placeholder
- `backend/pkg/fcm`: Firebase notification placeholder
- `backend/migrations`: SQL migrations `001` through `021`

Frontend layout:

- `frontend/app`: Next.js pages and layouts
- `frontend/components`: shared UI and feature components
- `frontend/lib`: API client, utility functions, Sobi assets, Google auth helper, AI markdown formatting
- `frontend/store`: Zustand stores
- `frontend/services/api`: small API wrappers for auth and chat

## Active Backend API

Base path: `/api/v1`

Public:

- `GET /health`
- `GET /public/explain/:id`
- `GET /public/summary/:id`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/refresh`

Protected user:

- `GET /user/profile`
- `PATCH /user/profile`

Protected upload, only registered when Cloudinary initializes:

- `POST /upload/profile`
- `POST /upload/posts`
- `POST /upload/attachments`

Protected learning features:

- `POST /explain`
- `GET /explain/history`
- `GET /explain/:id`
- `POST /explain/:id/re-explain`
- `POST /chat/sessions`
- `GET /chat/sessions`
- `GET /chat/sessions/:id`
- `POST /chat/sessions/:id/messages`
- `DELETE /chat/sessions/:id`
- `POST /practice/start`
- `GET /practice/sessions/:id`
- `POST /practice/questions/:id/answer`
- `POST /practice/sessions/:id/finish`
- `GET /practice/sessions/:id/result`
- `GET /practice/history`
- `GET /practice/progress`
- `POST /summary`
- `GET /summary/history`
- `GET /summary/:id`
- `DELETE /summary/:id`
- `POST /schedule/generate`
- `GET /schedule`
- `GET /gamification/points`
- `GET /gamification/badges`
- `GET /gamification/leaderboard`

## Feature Status

Jelasin Soal:

- Active backend handler, service, repository, model, DTO, and Gemini prompt.
- Supports typed question and image URL.
- Image upload flow depends on Cloudinary being configured.
- Includes history, detail, re-explain, and public share retrieval.
- Awards gamification points after successful explanation.

Tanya Sobi:

- Active chat session and message persistence.
- Gemini receives conversation history and current message.
- Failed AI calls create a user-facing failed assistant message.
- Frontend has chat list and session detail page.
- Awards gamification points after successful assistant response.

Latihan Soal:

- Active session creation, Gemini question generation, answer submission, session finishing, result, history, and daily progress.
- Generates five questions per session.
- Stores correct answer and explanation in the database.
- Result scoring is based on correct answers over total questions.
- Awards points based on final score.

Rangkum Materi:

- Active text summarization through Gemini.
- History, detail, delete, and public share retrieval are implemented.
- PDF/image extraction is not implemented yet. Non-text `source_type` returns an explicit error.

Jadwal Belajar:

- Active AI schedule generation from subjects, exam dates, available days, and daily hours.
- Stores generated sessions as JSON.
- Can list previously generated schedules.
- Reminder repository methods exist, but reminder delivery is not wired into a runtime job.

Gamification:

- Active points lookup, points logging, badge listing, owned badge mapping, manual award method, and leaderboard.
- Points are added from explain, chat, practice, and summary flows.
- Default badges are seeded by migration `021_seed_default_badges.sql`.
- Badge unlock is evaluated automatically after points are added.

Profile and Auth:

- Email/password register and login.
- Google login with auto-registration.
- JWT access and refresh tokens.
- Profile read/update.
- Avatar URL and Cloudinary public ID are supported.
- Streak is updated on login and Google login.

Upload:

- Active Cloudinary upload for profile, posts, and attachments.
- Validates max size at 5 MB.
- Accepts JPEG, PNG, and WebP.
- Saves uploaded image metadata to the `images` table.
- Upload routes are disabled if Cloudinary credentials are missing or invalid.

Collaboration:

- Database tables, models, DTOs, handler, UI placeholder page, and UI components exist.
- Backend group service and repository methods currently return placeholder values.
- Group routes are not registered in the active router.
- The product should treat this feature as scaffolded, not complete.

## Frontend Pages

Public/auth:

- `/`: landing page
- `/login`: email/password and Google login
- `/register`: registration and Google signup
- `/share/[id]`: public explain/summary share page

Protected app:

- `/dashboard`
- `/chat`
- `/chat/session/[id]`
- `/explain`
- `/explain/history`
- `/explain/result`
- `/practice`
- `/practice/session`
- `/practice/result`
- `/practice/history`
- `/summary`
- `/summary/result/[id]`
- `/schedule`
- `/badges`
- `/leaderboard`
- `/groups`
- `/profile`
- `/profile/edit`
- `/profile/help`
- `/profile/security`
- `/profile/settings`

## Data Model and Migrations

Current migrations create or modify:

- `users`
- `explanations`
- `practice_sessions`
- `questions`
- `chat_sessions`
- `chat_messages`
- `summaries`
- `study_schedules`
- `reminders`
- `badges`
- `user_badges`
- `points_log`
- `study_groups`
- `group_members`
- `group_notes`
- `images`

Later migrations add:

- `users.last_activity_at`
- Google login support with nullable password hash and `google_id`
- `chat_messages.status`
- `users.avatar_url`
- `users.avatar_public_id`

The migration runner applies all `.sql` files in sorted order. It does not track already-applied migrations in a schema migrations table, so SQL files should remain idempotent.

## Important Gaps and Risks

- Group collaboration is scaffolded but not functional.
- Summary file upload/extraction is not implemented despite older docs claiming PDF support.
- Cloudflare R2 and FCM are placeholder packages.
- Rate limiting middleware is a no-op.
- Backend migrations do not use a migration tracking table.
- Some handlers return raw `gin.H{"error": ...}` while others return `BaseResponse`; the frontend API client partially normalizes only the `BaseResponse` success shape.

## Current Product Decision

Groups/Kolaborasi should be treated as a future feature for now. The existing database migrations, models, DTOs, handler, and `/groups` placeholder page can stay as scaffolding, but the active product should not present collaboration as a completed feature until backend repository/service logic and route registration are implemented.

## Next Recommended Work

Recommended order:

1. Standardize backend API response and error shapes so frontend handling is predictable across all features.
2. Keep Summary positioned as text-based summarization, or implement PDF/image text extraction before advertising file-based summaries.
3. Add focused backend tests for auth, practice scoring, summary validation, and gamification point mutations.

Near-term priority:

- API response consistency, automatic badge unlock, and empty frontend placeholder cleanup are now implemented.
- Keep Groups/Kolaborasi documented as scaffolded/future work until the team intentionally starts that feature.

## Local Development

Backend:

```bash
cd backend
go run cmd/migrate/main.go up
go run cmd/server/main.go
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Checks:

```bash
cd backend && go test ./...
cd frontend && npx tsc --noEmit
```
