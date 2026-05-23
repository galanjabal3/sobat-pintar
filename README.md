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
- **Next.js 14** (App Router)
- **TailwindCSS** — styling
- **Poppins + Plus Jakarta Sans** — typography

### Infrastructure
- **Railway** — backend deployment
- **Vercel** — frontend deployment
- **Supabase** — managed PostgreSQL

---

## 🚀 Getting Started

### Prerequisites
- Go 1.26.3
- Node.js 20+
- Supabase project with PostgreSQL connection string
- Redis 7 is not required for the current active runtime
- Gemini API Key ([get free at Google AI Studio](https://aistudio.google.com))

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
# Fill DATABASE_URL, GEMINI_API_KEY, and JWT_SECRET in .env

# Install dependencies
go mod tidy

# Run database migrations
go run cmd/migrate/main.go up

# Start development server
go run cmd/server/main.go
```

Backend will run at `http://localhost:8080`

### 3. Setup Frontend

```bash
cd frontend

# Copy env file
cp .env.local.example .env.local
# Fill in your values

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at `http://localhost:3000`

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
POST /auth/google      Login/register with Google ID token
POST /auth/refresh     Refresh access token
```

### Jelasin Soal
```
POST   /explain           Explain a question (text or image)
GET    /explain/history   Get explanation history
GET    /explain/:id       Get explanation detail
POST   /explain/:id/re-explain
GET    /public/explain/:id
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
GET    /public/summary/:id
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
