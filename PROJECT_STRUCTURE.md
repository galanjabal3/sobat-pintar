# Sobat Pintar — Complete Project Structure

> Full folder & file structure from start to finish.
> Use this as reference when setting up the project or prompting AI assistants (GitLab Copilot, Continue, etc.)

---

## Root Structure

```
sobat-pintar/
├── backend/                        # Go + Gin REST API
├── frontend/                       # Next.js 14 App
├── docs/                           # Project documentation
├── .devcontainer/                  # Dev Container configuration
├── .gitignore                      # Git ignore rules
├── docker-compose.yml              # Local dev environment
├── README.md                       # Project overview
├── SETUP.md                        # Setup & running guide
├── PROJECT_STRUCTURE.md            # This file
├── GEMINI.md                       # AI context file (Gemini)
└── CLAUDE.md                       # AI assistant context file (Claude)
```

---

## Backend (Go + Gin)

```
backend/
├── cmd/
│   ├── server/
│   │   └── main.go                 # Entry point — starts HTTP server
│   └── migrate/
│       └── main.go                 # Run DB migrations (up/down)
│
├── internal/
│   ├── config/
│   │   ├── config.go               # Load & validate env variables
│   │   └── database.go             # DB connection setup (PostgreSQL)
│   │
│   ├── middleware/
│   │   ├── auth.go                 # JWT authentication middleware
│   │   ├── cors.go                 # CORS configuration
│   │   ├── logger.go               # Request logging middleware
│   │   ├── ratelimit.go            # Rate limiting per IP/user
│   │   └── recovery.go             # Panic recovery middleware
│   │
│   ├── handler/
│   │   ├── auth_handler.go         # POST /auth/register, /auth/login, /auth/refresh
│   │   ├── explain_handler.go      # POST /explain, GET /explain/history
│   │   ├── practice_handler.go     # GET /practice, POST /practice/submit
│   │   ├── chat_handler.go         # POST /chat, GET /chat/history
│   │   ├── summary_handler.go      # POST /summary
│   │   ├── schedule_handler.go     # POST /schedule/generate, GET /schedule
│   │   ├── gamification_handler.go # GET /points, GET /badges, GET /leaderboard
│   │   ├── group_handler.go        # CRUD /groups, POST /groups/:id/notes
│   │   ├── user_handler.go         # GET/PUT /user/profile
│   │   └── health_handler.go       # GET /health (for deployment checks)
│   │
│   ├── service/
│   │   ├── auth_service.go         # Register, login, token management
│   │   ├── explain_service.go      # Core explain logic + Gemini call
│   │   ├── practice_service.go     # Generate & evaluate practice questions
│   │   ├── chat_service.go         # Chat session + message history
│   │   ├── summary_service.go      # Summarize PDF/text via Gemini
│   │   ├── schedule_service.go     # Generate study schedule via Gemini
│   │   ├── notification_service.go # Push notification via Firebase FCM
│   │   ├── gamification_service.go # Points, streak, badge unlock logic
│   │   ├── group_service.go        # Study group + shared notes logic
│   │   └── user_service.go         # User profile CRUD
│   │
│   ├── repository/
│   │   ├── user_repository.go      # DB queries: users table
│   │   ├── explain_repository.go   # DB queries: explanations table
│   │   ├── practice_repository.go  # DB queries: practice_sessions, answers
│   │   ├── chat_repository.go      # DB queries: chat_sessions, messages
│   │   ├── summary_repository.go   # DB queries: summaries table
│   │   ├── schedule_repository.go  # DB queries: study_schedules, reminders
│   │   ├── gamification_repository.go # DB queries: points, badges, leaderboard
│   │   └── group_repository.go     # DB queries: study_groups, group_notes
│   │
│   ├── model/
│   │   ├── user.go                 # User struct + DB model
│   │   ├── explain.go              # Explanation struct
│   │   ├── practice.go             # PracticeSession, Question, Answer structs
│   │   ├── chat.go                 # ChatSession, Message structs
│   │   ├── summary.go              # Summary struct
│   │   ├── schedule.go             # StudySchedule, Reminder structs
│   │   ├── gamification.go         # Points, Badge, UserBadge, Leaderboard structs
│   │   └── group.go                # StudyGroup, GroupMember, GroupNote structs
│   │
│   ├── dto/
│   │   ├── auth_dto.go             # Request/Response DTOs for auth
│   │   ├── explain_dto.go          # Request/Response DTOs for explain
│   │   ├── practice_dto.go         # Request/Response DTOs for practice
│   │   ├── chat_dto.go             # Request/Response DTOs for chat
│   │   ├── summary_dto.go          # Request/Response DTOs for summary
│   │   ├── schedule_dto.go         # Request/Response DTOs for schedule
│   │   ├── gamification_dto.go     # Request/Response DTOs for points/badges
│   │   ├── group_dto.go            # Request/Response DTOs for groups
│   │   └── common_dto.go           # BaseResponse, ErrorResponse, Pagination
│   │
│   └── router/
│       └── router.go               # Register all routes + middleware
│
├── pkg/
│   ├── gemini/
│   │   ├── client.go               # Gemini API client initialization
│   │   ├── explain.go              # Explain question prompt builder
│   │   ├── practice.go             # Generate practice questions prompt
│   │   ├── chat.go                 # Chat conversation prompt
│   │   ├── summary.go              # Summarize text/PDF prompt
│   │   ├── schedule.go             # Study schedule prompt builder
│   │   └── vision.go               # Handle image input to Gemini
│   │
│   ├── jwt/
│   │   ├── jwt.go                  # Generate & validate JWT tokens
│   │   └── claims.go               # JWT claims struct
│   │
│   ├── redis/
│   │   ├── client.go               # Redis connection
│   │   ├── cache.go                # Generic get/set/delete cache
│   │   └── session.go              # Chat session storage in Redis
│   │
│   ├── storage/
│   │   ├── r2.go                   # Cloudflare R2 client
│   │   └── upload.go               # Upload image/PDF, return public URL
│   │
│   ├── fcm/
│   │   ├── client.go               # Firebase FCM client initialization
│   │   └── notification.go         # Send push notification to device token
│   │
│   ├── logger/
│   │   └── logger.go               # Structured logger (zerolog)
│   │
│   └── validator/
│       └── validator.go            # Request body validation helper
│
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_explanations.sql
│   ├── 003_create_practice_sessions.sql
│   ├── 004_create_questions.sql
│   ├── 005_create_chat_sessions.sql
│   ├── 006_create_messages.sql
│   ├── 007_create_summaries.sql
│   ├── 008_create_study_schedules.sql
│   ├── 009_create_reminders.sql
│   ├── 010_create_badges.sql
│   ├── 011_create_user_badges.sql
│   ├── 012_create_points_log.sql
│   ├── 013_create_study_groups.sql
│   ├── 014_create_group_members.sql
│   └── 015_create_group_notes.sql
│
├── .env                            # Local env (git ignored)
├── .env.example                    # Env template (committed)
├── .gitignore
├── go.mod
├── go.sum
└── Dockerfile
```

---

## Frontend (Next.js 14 + TailwindCSS)

```
frontend/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout (font, metadata, providers)
│   ├── page.tsx                    # Landing page (redirect to /dashboard or /login)
│   ├── globals.css                 # Global styles + Tailwind base
│   │
│   ├── (auth)/                     # Auth route group (no bottom nav)
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   └── register/
│   │       └── page.tsx            # Register + level selector (TK/SD/SMP/SMA)
│   │
│   ├── (app)/                      # Main app route group (with bottom nav)
│   │   ├── layout.tsx              # Layout with BottomNav
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Home dashboard (greeting, feature cards, streak)
│   │   ├── explain/
│   │   │   ├── page.tsx            # Jelasin Soal main page
│   │   │   ├── result/
│   │   │   │   └── page.tsx        # Explanation result page
│   │   │   └── history/
│   │   │       └── page.tsx        # Past explanations list
│   │   ├── chat/
│   │   │   └── page.tsx            # Tanya Sobi chat page
│   │   ├── practice/
│   │   │   ├── page.tsx            # Latihan Soal — subject selector
│   │   │   ├── session/
│   │   │   │   └── page.tsx        # Active practice session
│   │   │   └── result/
│   │   │       └── page.tsx        # Practice result + score
│   │   ├── summary/
│   │   │   ├── page.tsx            # Rangkum Materi — upload page
│   │   │   └── result/
│   │   │       └── page.tsx        # Summary result page
│   │   ├── schedule/
│   │   │   ├── page.tsx            # Jadwal Belajar — input subjects + exam dates
│   │   │   └── result/
│   │   │       └── page.tsx        # Generated study schedule view
│   │   ├── leaderboard/
│   │   │   └── page.tsx            # Leaderboard + ranking
│   │   ├── badges/
│   │   │   └── page.tsx            # Badge collection page
│   │   ├── groups/
│   │   │   ├── page.tsx            # Study groups list
│   │   │   ├── create/
│   │   │   │   └── page.tsx        # Create new group
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Group detail + notes
│   │   │       └── discuss/
│   │   │           └── page.tsx    # Group discussion
│   │   └── profile/
│   │       └── page.tsx            # User profile + settings
│   │
│   └── api/                        # Next.js API routes (proxy to backend)
│       └── upload/
│           └── route.ts            # Handle file upload before sending to backend
│
├── components/
│   ├── ui/                         # Base reusable UI components
│   │   ├── Button.tsx              # Primary, secondary, outlined variants
│   │   ├── Card.tsx                # Feature card, result card
│   │   ├── Input.tsx               # Text input, textarea
│   │   ├── Badge.tsx               # Level badge (TK/SD/SMP/SMA), difficulty
│   │   ├── Avatar.tsx              # User + Sobi mascot avatar
│   │   ├── Modal.tsx               # Bottom sheet modal
│   │   ├── Spinner.tsx             # Loading spinner
│   │   └── Toast.tsx               # Success/error notifications
│   │
│   ├── layout/
│   │   ├── BottomNav.tsx           # Bottom tab navigation (4 tabs)
│   │   ├── Header.tsx              # Page header with back button + title
│   │   └── PageWrapper.tsx         # Consistent page padding/max-width
│   │
│   ├── sobi/
│   │   ├── SobiMascot.tsx          # Sobi character (SVG/image)
│   │   ├── SobiMessage.tsx         # Sobi speech bubble with message
│   │   └── SobiEncouragement.tsx   # Sobi reaction after practice answer
│   │
│   ├── explain/
│   │   ├── PhotoUpload.tsx         # Camera / file upload area
│   │   ├── LevelSelector.tsx       # TK / SD / SMP / SMA selector
│   │   ├── ExplainResult.tsx       # AI explanation display card
│   │   ├── ReExplainButton.tsx     # "Masih bingung? Jelaskan lagi" button
│   │   └── ExplainHistoryCard.tsx  # Single item in history list
│   │
│   ├── chat/
│   │   ├── ChatBubble.tsx          # User and Sobi message bubbles
│   │   ├── ChatInput.tsx           # Input + send button
│   │   └── QuickSuggestions.tsx    # Chip buttons (Jelasin rumus, Bantu PR, etc.)
│   │
│   ├── practice/
│   │   ├── SubjectCard.tsx         # Subject selector card (Matematika, IPA, etc.)
│   │   ├── QuestionCard.tsx        # Question display with progress bar
│   │   ├── AnswerOption.tsx        # A/B/C/D answer button
│   │   └── PracticeResult.tsx      # Score + Sobi encouragement
│   │
│   └── dashboard/
│       ├── GreetingHeader.tsx      # "Halo, [Name]! Mau belajar apa hari ini?"
│       ├── FeatureGrid.tsx         # 2x2 grid of feature cards
│       ├── StreakCard.tsx           # Daily streak counter
│       └── ProgressCard.tsx        # Today's progress summary
│
│   ├── schedule/
│   │   ├── SubjectInput.tsx        # Input mata pelajaran + tanggal ujian
│   │   ├── ScheduleCard.tsx        # Single day schedule display
│   │   └── ReminderToggle.tsx      # Enable/disable reminder per item
│   │
│   ├── gamification/
│   │   ├── PointsBadge.tsx         # Points display (header/profile)
│   │   ├── StreakFlame.tsx          # Streak flame animation
│   │   ├── BadgeCard.tsx           # Single badge (locked/unlocked)
│   │   └── LeaderboardRow.tsx      # Single row in leaderboard
│   │
│   └── groups/
│       ├── GroupCard.tsx           # Study group card in list
│       ├── MemberAvatar.tsx        # Group member avatar stack
│       ├── NoteEditor.tsx          # Shared note editor
│       └── DiscussionBubble.tsx    # Group discussion message
│
├── lib/
│   ├── api.ts                      # Axios/fetch wrapper with auth header
│   ├── auth.ts                     # Token storage, login/logout helpers
│   ├── gemini.ts                   # Direct Gemini calls (if needed client-side)
│   └── utils.ts                    # cn(), formatDate(), truncate(), etc.
│
├── hooks/
│   ├── useAuth.ts                  # Auth state, redirect if not logged in
│   ├── useExplain.ts               # Explain API calls + loading state
│   ├── useChat.ts                  # Chat messages state management
│   ├── usePractice.ts              # Practice session state
│   └── useUser.ts                  # User profile data
│
├── store/
│   └── authStore.ts                # Zustand store for auth state
│
├── types/
│   ├── auth.ts                     # User, LoginRequest, RegisterRequest types
│   ├── explain.ts                  # Explanation, ExplainRequest types
│   ├── chat.ts                     # Message, ChatSession types
│   ├── practice.ts                 # Question, Answer, PracticeSession types
│   └── api.ts                      # BaseResponse, ApiError types
│
├── constants/
│   ├── levels.ts                   # LEVELS = ['TK', 'SD', 'SMP', 'SMA']
│   ├── subjects.ts                 # SUBJECTS = ['Matematika', 'IPA', ...]
│   └── routes.ts                   # APP_ROUTES = { dashboard: '/dashboard', ... }
│
├── public/
│   ├── sobi/
│   │   ├── sobi-default.png        # Default Sobi mascot
│   │   ├── sobi-happy.png          # Sobi happy (correct answer)
│   │   ├── sobi-thinking.png       # Sobi thinking (loading)
│   │   └── sobi-encourage.png      # Sobi encouraging (wrong answer)
│   ├── icons/
│   │   ├── icon-explain.svg
│   │   ├── icon-chat.svg
│   │   ├── icon-practice.svg
│   │   └── icon-summary.svg
│   └── logo.svg                    # Sobat Pintar logo
│
├── .env.local                      # Local env (git ignored)
├── .env.local.example              # Env template (committed)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

## Database Schema

```
migrations/
│
├── 001_create_users.sql
│   └── users (id, name, email, password_hash, level, streak, points, created_at)
│
├── 002_create_explanations.sql
│   └── explanations (id, user_id, question_text, image_url, level, answer, created_at)
│
├── 003_create_practice_sessions.sql
│   └── practice_sessions (id, user_id, subject, difficulty, score, completed_at)
│
├── 004_create_questions.sql
│   └── questions (id, session_id, question_text, options jsonb, correct_answer, user_answer, is_correct)
│
├── 005_create_chat_sessions.sql
│   └── chat_sessions (id, user_id, title, created_at)
│
├── 006_create_messages.sql
│   └── messages (id, session_id, role, content, created_at)
│
├── 007_create_summaries.sql
│   └── summaries (id, user_id, source_type, file_url, content, summary, created_at)
│
├── 008_create_study_schedules.sql
│   └── study_schedules (id, user_id, subject, exam_date, sessions jsonb, created_at)
│
├── 009_create_reminders.sql
│   └── reminders (id, user_id, schedule_id, remind_at, is_sent)
│
├── 010_create_badges.sql
│   └── badges (id, name, description, icon_url, condition_type, condition_value)
│
├── 011_create_user_badges.sql
│   └── user_badges (id, user_id, badge_id, earned_at)
│
├── 012_create_points_log.sql
│   └── points_log (id, user_id, activity_type, points, created_at)
│
├── 013_create_study_groups.sql
│   └── study_groups (id, name, subject, owner_id, invite_code, created_at)
│
├── 014_create_group_members.sql
│   └── group_members (id, group_id, user_id, joined_at)
│
└── 015_create_group_notes.sql
    └── group_notes (id, group_id, user_id, title, content, updated_at)
```

---

## DevOps & CI/CD

```
sobat-pintar/
├── docker-compose.yml              # Local: postgres + redis + backend + frontend
├── docker-compose.prod.yml         # Production: same + nginx
│
├── backend/
│   └── Dockerfile                  # Multi-stage Go build
│
├── frontend/
│   └── Dockerfile                  # Multi-stage Next.js build
│
└── .gitlab-ci.yml                  # GitLab CI/CD
    ├── stages: test → build → deploy
    ├── test:    go test ./... + npm run lint
    ├── build:   docker build + push to registry
    └── deploy:  Railway (backend) + Vercel (frontend)
```

---

## Docs

```
docs/
├── api.md                          # All API endpoint references
├── architecture.md                 # System architecture diagram + explanation
├── design.md                       # Design system (colors, fonts, components)
├── gemini-prompts.md               # All Gemini prompt templates per feature
└── deployment.md                   # Step-by-step deployment guide
```

---

## Build Order (Phase by Phase)

```
Phase 1 — Foundation ✅ Done
Phase 2 — Latihan Soal ✅ Done
Phase 3 — Tanya Sobi ✅ Done
Phase 4 — Rangkum Materi ✅ Done
Phase 5 — Jadwal & Reminder ✅ Done
Phase 6 — Gamification ✅ Done
Phase 7 — Kolaborasi ✅ Done
```

---

## Key Dependencies

### Backend (go.mod)
```
github.com/gin-gonic/gin            # HTTP framework
github.com/golang-jwt/jwt/v5        # JWT auth
github.com/jackc/pgx/v5             # PostgreSQL driver
github.com/redis/go-redis/v9        # Redis client
github.com/google/generative-ai-go  # Gemini SDK
github.com/rs/zerolog               # Structured logging
github.com/joho/godotenv            # Load .env file
github.com/go-playground/validator  # Request validation
github.com/cloudflare/cloudflare-go # R2 storage
firebase.google.com/go/v4           # Firebase FCM (push notifications)
golang.org/x/crypto                 # bcrypt password hashing
```

### Frontend (package.json)
```
next@14                             # Next.js framework
react@18                            # React
tailwindcss                         # Styling
zustand                             # State management
axios                               # HTTP client
react-hook-form                     # Form handling
zod                                 # Schema validation
lucide-react                        # Icons
@radix-ui/react-*                   # Accessible UI primitives
framer-motion                       # Animations
```

---

## Environment Variables Reference

### Backend (.env)
```env
# Server
APP_PORT=8080
APP_ENV=development                 # development | production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sobat_pintar
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL_MODE=disable                 # disable for local, require for prod

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_very_long_secret_key
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=sobat-pintar
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Firebase FCM (Phase 5 — Push Notifications)
FIREBASE_PROJECT_ID=
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_NAME=Sobat Pintar
NEXT_PUBLIC_APP_URL=http://localhost:3000
```