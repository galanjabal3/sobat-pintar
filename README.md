# 🤖 Sobat Pintar

> **Teman belajar AI untuk semua pelajar Indonesia**

Sobat Pintar adalah platform belajar berbasis AI yang dirancang khusus untuk pelajar Indonesia dari tingkat TK hingga SMA. Dengan maskot **Sobi** yang friendly, aplikasi ini hadir sebagai teman belajar — bukan guru yang kaku.

---

## ✨ Fitur Utama

| Fitur | Deskripsi | Status |
|---|---|---|
| 📸 **Jelasin Soal** | Foto atau ketik soal, AI jelaskan sesuai level | ✅ Done |
| 💬 **Tanya Sobi** | Chat bebas dengan AI tutor | ✅ Done |
| 📝 **Latihan Soal** | Latihan dari topik atau materi sendiri, lengkap dengan pembahasan | ✅ Done |
| 📄 **Rangkum Materi** | Teks materi dirangkum otomatis oleh AI | ✅ Done |
| 🗓️ **Jadwal Belajar** | AI bantu buat jadwal belajar yang realistis | ✅ Done |
| 🏆 **Gamification** | Poin, streak harian, badge, leaderboard | ✅ Done |
| 👥 **Kolaborasi** | Grup belajar, shared notes, diskusi soal | 🚧 Scaffolded |

---

## 🎯 Target Pengguna

- **TK & SD** — Penjelasan super simple dengan analogi lucu
- **SMP** — Bahasa santai, step-by-step
- **SMA** — Penjelasan lengkap dengan rumus dan contoh soal

---

## 🛠️ Tech Stack

### Backend
- **Go 1.26.3** with **Gin** framework
- **Supabase PostgreSQL** — primary database
- **Redis 7** — optional helper package, not wired into active runtime
- **Google Gemini** — AI engine
- **Cloudinary** — active image upload storage
- **Cloudflare R2** — placeholder storage package

### Frontend
- **Next.js 15.5** (App Router)
- **TailwindCSS** — styling
- **Poppins + Plus Jakarta Sans** — typography

### Infrastructure
- **Vercel** — intended frontend deployment
- **Supabase** — intended managed PostgreSQL
- **Backend hosting** — to be selected before production deployment

---

## 🚀 Getting Started

### Prerequisites
- Go 1.26.3
- Node.js 20+
- Supabase project with PostgreSQL connection string
- Redis 7 is not required for the current active runtime
- Gemini API Key ([get free at Google AI Studio](https://aistudio.google.com))
- Google OAuth 2.0 Web Client for Google sign-in
- Cloudinary account for image upload features

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sobat-pintar.git
cd sobat-pintar
```

### 2. Setup Backend

```bash
cd backend

# Copy env file
cp .env.example .env
# Fill DATABASE_URL, GEMINI_API_KEY, JWT_SECRET, Cloudinary, Google OAuth,
# and SMTP values in .env

# Install dependencies
go mod tidy

# Run database migrations
go run cmd/migrate/main.go up

# Start development server
go run cmd/server/main.go
```

Backend will run at `http://localhost:8080`

Important backend development variables:

```env
APP_BASE_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
GOOGLE_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must come from the same
Google OAuth **Web application** credential. Add `http://localhost:3000`
to its Authorized JavaScript origins.

### 3. Setup Frontend

```bash
cd frontend

# Copy env file
cp .env.local.example .env.local
# Fill in your values

# Install dependencies
npm install

# Install browser binary for smoke tests (first setup only)
npx playwright install chromium

# Start development server
npm run dev
```

Frontend will run at `http://localhost:3000`

Required frontend values:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same-web-client-id>.apps.googleusercontent.com
```

Optional real-backend integration test account values can be added to the local
`frontend/.env.local` file. Do not commit real credentials:

```env
E2E_TEST_EMAIL=<active-test-account-email>
E2E_TEST_PASSWORD=<active-test-account-password>
```

### 4. Development Checks

```bash
# Backend
cd backend
go test ./...

# Frontend
cd ../frontend
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Playwright runs headless by default. To watch the smoke tests in Chrome:

```bash
# Show the browser while tests run
npm run test:e2e -- --headed

# Open browser with the Playwright debugger
npm run test:e2e -- --headed --debug

# Open Playwright UI to select and run tests interactively
npm run test:e2e -- --ui
```

The smoke tests mock API responses so frontend flows can be tested
deterministically. Verify the real Google OAuth popup manually with valid local
credentials when changing sign-in behavior.

To verify email login against the running backend and an active test account:

```bash
# Requires backend running on the NEXT_PUBLIC_API_URL target and E2E_TEST_* values
npm run test:e2e:integration -- --headed
```

The integration login test runs only in desktop Chromium with one worker to
avoid issuing repeated login requests against the authentication rate limit.

---

## 📁 Project Structure

```
sobat-pintar/
├── backend/
│   ├── cmd/server/         # Entry point
│   ├── internal/
│   │   ├── handler/        # HTTP handlers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Database queries
│   │   ├── middleware/     # Auth, logging
│   │   └── model/          # Structs & models
│   ├── pkg/
│   │   ├── gemini/         # Gemini API wrapper
│   │   ├── redis/          # Optional Redis helpers
│   │   └── storage/        # R2 placeholder storage helpers
│   └── migrations/         # SQL migrations
│
├── frontend/
│   ├── app/                # Next.js pages (App Router)
│   ├── components/         # UI components
│   ├── lib/                # API client, utilities
│   └── public/             # Static assets
│
└── *.md                    # Project documentation and AI context files
```

---

## 🎨 Design System

### Brand Colors

```
Primary   #02D48F   Teal (main brand)
Secondary #FACC15   Yellow (CTA, accent)
Tertiary  #FFAC5A   Orange (highlights)
Neutral   #717676   Gray (secondary text)
```

### Mascot
**Sobi** — robot kecil berwarna teal yang selalu semangat dan encouraging.
Muncul di home screen, chat, dan setelah jawab soal latihan.

---

## 📡 API Documentation

Base URL: `http://localhost:8080/api/v1`

### Auth
```
POST /auth/register    Register new user
POST /auth/login       Login
POST /auth/google      Login/register with Google authorization code
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/refresh     Refresh access cookie
POST /auth/logout      Clear auth cookies
```

Email and Google sign-in store session tokens in HttpOnly cookies. Frontend
requests must include credentials so protected routes can read those cookies.

### Jelasin Soal
```
POST   /explain           Explain a question (text or image)
GET    /explain/history   Get explanation history
GET    /explain/:id       Get explanation detail
POST   /explain/:id/re-explain
POST   /explain/:id/share Create private share token
GET    /public/explain/:token
```

### User
```
GET  /user/profile    Get profile
PATCH /user/profile   Update profile
```

### Tanya Sobi
```
POST   /chat/sessions
GET    /chat/sessions
GET    /chat/sessions/:id
POST   /chat/sessions/:id/messages
DELETE /chat/sessions/:id
```

### Latihan Soal
```
POST /practice/start
GET  /practice/sessions/:id
POST /practice/questions/:id/answer
POST /practice/sessions/:id/finish
GET  /practice/sessions/:id/result
GET  /practice/history
GET  /practice/progress
```

### Rangkum Materi
```
POST   /summary
GET    /summary/history
GET    /summary/:id
DELETE /summary/:id
POST   /summary/:id/share Create private share token
GET    /public/summary/:token
```

### Jadwal, Upload, dan Gamification
```
POST /schedule/generate
GET  /schedule
GET  /schedule/:id
DELETE /schedule/:id
POST /upload/profile
POST /upload/posts
POST /upload/attachments
GET  /gamification/points
GET  /gamification/badges
GET  /gamification/leaderboard
```

### AI Usage
```
GET /ai/usage
```

### Health
```
GET /health    Readiness check, including database connectivity
```

Public explanation and summary links use generated share tokens rather than
database record IDs. A result is not publicly readable until its owner creates
a share link.

---

## Production Configuration Notes

- Run `go run cmd/migrate/main.go up` against the production database before serving traffic.
- Set `APP_BASE_URL` and `CORS_ALLOWED_ORIGINS` to the deployed frontend origin.
- Add the deployed Vercel origin to the same Google OAuth Web Client used by frontend and backend.
- Set `APP_ENV=production`; internal error details are then omitted from API responses.
- Provide Cloudinary and SMTP credentials when enabling uploads and email verification.
- The current rate limiter is in-memory and is intended for a single backend instance. Use shared storage before scaling horizontally.

---

## 🗺️ Roadmap

```
Q2 2026   Phase 1-6 — Core Features ✅ Complete
Q2 2026   Phase 7 — Collaboration 🚧 Scaffolded
Q3 2026   Phase 8 — Advanced Analytics & Teacher Dashboard
Q4 2026   Phase 9 — Interactive Live Quiz
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/nama-fitur`)
3. Commit your changes (`git commit -m 'feat: tambah fitur X'`)
4. Push to the branch (`git push origin feat/nama-fitur`)
5. Open a Pull Request

### Commit Convention
```
feat:     new feature
fix:      bug fix
refactor: code refactor
chore:    dependencies, config
docs:     documentation update
```

---

## 📄 License

MIT License — feel free to use and modify.

---

## 👨‍💻 Author

Built with ❤️ for Indonesian students.

> *"Belajar itu mudah kalau ada teman yang sabar menjelaskan."*
