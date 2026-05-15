# Sobat Pintar — Setup & Running Guide

> Panduan lengkap untuk setup, menjalankan, dan memahami project Sobat Pintar.
> Baca file ini setiap kali lupa cara setup atau menjalankan project.

---

## 📁 Struktur File Penting

```
sobat-pintar/
├── CLAUDE.md              # Konteks AI — dibaca otomatis oleh Antigravity/Claude Code
├── README.md              # Dokumentasi publik project
├── PROJECT_STRUCTURE.md   # Blueprint lengkap semua folder & file
├── SETUP.md               # File ini — panduan setup & running
├── docker-compose.yml     # Docker untuk production/standalone
├── .devcontainer/         # Dev Container untuk VSCode/Antigravity
│   ├── devcontainer.json  # Konfigurasi Dev Container
│   ├── docker-compose.yml # Docker untuk development
│   ├── Dockerfile         # Image untuk container app
│   └── setup.sh           # Script auto-setup saat container pertama dibuat
├── backend/               # Go + Gin API
└── frontend/              # Next.js 14
```

---

## 🐳 Penjelasan Docker & Dev Container

### Apa itu Docker?
Docker menjalankan aplikasi dalam "container" — environment yang terisolasi.
Kamu tidak perlu install PostgreSQL, Redis, Go, atau Node.js langsung di Mac.
Semua sudah ada di dalam container.

### Apa itu Dev Container?
Dev Container adalah container khusus untuk development.
VSCode/Antigravity "masuk" ke dalam container — jadi semua terminal command
dijalankan di dalam container, bukan di Mac kamu.

### Diagram Alur

```
Mac kamu
├── Docker Desktop (engine)
│   └── Container: sobat-pintar_devcontainer
│       ├── app-1      → environment Go + Node.js
│       ├── postgres-1 → database PostgreSQL 15
│       └── redis-1    → cache Redis 7
│
├── VSCode / Antigravity
│   └── "Reopen in Container"
│       → masuk ke dalam app-1
│       → semua terminal = terminal di dalam container
│       → file di /workspace = file di Mac kamu (mounted)
│
└── Browser
    ├── localhost:3000 → Frontend Next.js
    └── localhost:8080 → Backend Go API
```

### Kenapa File Tetap Ada Meski Container Dihapus?
File project di-**mount** dari Mac ke container — bukan disimpan di dalam container.
Jadi kalau container dihapus, file kamu tetap aman di:
`~/Documents/Portfolios/sobat-pintar/`

---

## Frontend Environment Variables: .env vs .env.local

- **`.env`**: Digunakan untuk environment variables yang bersifat **default** atau **umum** (misal: `NEXT_PUBLIC_API_URL` yang mengarah ke backend di dalam container). File ini akan dibaca oleh `docker-compose`.
- **`.env.local`**: Digunakan untuk **overrides lokal** atau variabel yang **sangat rahasia** di mesin Mac Anda sendiri. File ini secara otomatis diabaikan oleh `.gitignore` sehingga tidak akan ter-push ke GitHub.
- **Urutan Prioritas**: Next.js akan memprioritaskan `.env.local` daripada `.env`.

---

## 🚀 Cara Menjalankan dengan Docker Standalone (Production-like)

Jika Anda ingin menjalankan project di luar VSCode/Dev Container (mirip di server):

1. **Siapkan Environment File**:
   Pastikan file `.env` sudah ada di `backend/` dan `frontend/`.

2. **Jalankan Services**:
   ```bash
   docker compose up -d
   ```

3. **Stop Services**:
   ```bash
   docker compose down
   ```


### Prasyarat
- [ ] Docker Desktop terinstall dan running
- [ ] VSCode terinstall dengan extension "Dev Containers"
- [ ] Project ada di `~/Documents/Portfolios/sobat-pintar/`

### Step 1 — Pastikan Docker Desktop Running
```
Buka Docker Desktop → tunggu icon di menu bar Mac jadi hijau
Status: "Docker Desktop is running"
```

### Step 2 — Cek Container Masih Hidup
```bash
docker ps
```

Harusnya muncul 3 container:
```
sobat-pintar_devcontainer-app-1      → Up X hours
sobat-pintar_devcontainer-postgres-1 → Up X hours
sobat-pintar_devcontainer-redis-1    → Up X hours
```

Kalau kosong → lanjut ke Step 3. Kalau sudah ada → langsung Step 4.

### Step 3 — Jalankan Container (kalau mati)
```bash
cd ~/Documents/Portfolios/sobat-pintar
docker compose -f .devcontainer/docker-compose.yml up -d
```

Tunggu sampai semua container status "Up".

### Step 4 — Buka VSCode & Reopen in Container
```
1. Buka VSCode
2. File → Open Folder → pilih sobat-pintar/
3. Cmd+Shift+P → "Dev Containers: Reopen in Container"
4. Tunggu VSCode connect ke container (~30 detik)
5. Terminal akan menunjukkan: vscode → /workspace $
```

### Step 5 — Jalankan Backend
```bash
# Di terminal VSCode (sudah di dalam container)
cd /workspace/backend
go run cmd/server/main.go
```

Berhasil kalau muncul:
```
{"level":"info","message":"Server started on :8080"}
```

### Step 6 — Jalankan Frontend
```bash
# Buka terminal BARU di VSCode (klik + di panel terminal)
cd /workspace/frontend
npm run dev
```

Berhasil kalau muncul:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

### Step 7 — Buka Browser
```
http://localhost:3000 → Sobat Pintar app
http://localhost:8080/health → Backend health check
```

---

---

## 🛠️ Build & Test Commands

### Frontend (Next.js)

1.  **Build (Production):**
    ```bash
    cd /workspace/frontend
    npm run build
    ```
    *Akan membuat build produksi yang optimal di folder `.next`.*

2.  **Test:**
    ```bash
    cd /workspace/frontend
    npm test
    ```
    *Asumsi ada script `test` di `package.json` frontend.*

### Backend (Go)

1.  **Build (Executable):**
    ```bash
    cd /workspace/backend
    go build ./cmd/server/main.go
    ```
    *Akan menghasilkan file executable (misal: `main` atau `server`) di direktori `backend`.*

2.  **Test (Semua Package):**
    ```bash
    cd /workspace/backend
    go test ./...
    ```
    *Menjalankan semua test di dalam folder `backend` dan sub-foldernya.*

---

## 🔄 Cara Running Ulang Setelah Mac Restart

Setelah Mac restart, Docker container mati semua. Urutannya:

```bash
# 1. Buka Docker Desktop dulu, tunggu running

# 2. Jalankan container lagi
cd ~/Documents/Portfolios/sobat-pintar
docker compose -f .devcontainer/docker-compose.yml up -d

# 3. Cek semua running
docker ps

# 4. Buka VSCode → Reopen in Container

# 5. Jalankan backend & frontend
```

---

## 🛠️ Troubleshooting Umum

### Error: Port already in use

```bash
# Cek apa yang pakai port tersebut
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis
lsof -i :8080   # Backend
lsof -i :3000   # Frontend

# Stop service yang bentrok (contoh Redis dari Homebrew)
brew services stop redis
brew services stop postgresql@15

# Lalu jalankan ulang container
docker compose -f .devcontainer/docker-compose.yml down
docker compose -f .devcontainer/docker-compose.yml up -d
```

### Error: Container tidak mau start

```bash
# Hapus semua container lama dan mulai fresh
docker compose -f .devcontainer/docker-compose.yml down -v
docker rm -f $(docker ps -aq --filter name=sobat-pintar)
docker compose -f .devcontainer/docker-compose.yml up -d
```

### Error: go build — permission denied

```bash
sudo chown -R vscode:vscode /go
sudo chmod -R 755 /go
go mod tidy
```

### Error: npm install — permission denied

```bash
sudo chown -R vscode:vscode /workspace/frontend
npm install
```

### Error: .env tidak terbaca

Pastikan `.env` ada di `/workspace/backend/`:
```bash
ls -la /workspace/backend/ | grep .env
# Kalau tidak ada:
cp /workspace/backend/.env.example /workspace/backend/.env
# Lalu isi nilai yang diperlukan
```

### Dev Container loading lama di Antigravity

Antigravity Dev Container masih buggy. Gunakan **VSCode** untuk Dev Container.
Antigravity tetap bisa dipakai untuk generate kode tanpa Dev Container.

---

## 🗄️ Database

### Akses PostgreSQL via Terminal (dalam container)
```bash
psql -h postgres -U postgres -d sobat_pintar
```

Perintah berguna di dalam psql:
```sql
\dt                    -- list semua tabel
\d users               -- lihat struktur tabel users
SELECT * FROM users;   -- lihat semua data users
\q                     -- keluar
```

### Akses PostgreSQL via DBeaver (dari Mac)
```
Host     : localhost
Port     : 5432
Database : sobat_pintar
Username : postgres
Password : postgres123
```

### Jalankan Migrations
```bash
cd /workspace/backend

# Jalankan semua migration sekaligus
for f in migrations/*.sql; do
  psql -h postgres -U postgres -d sobat_pintar -f "$f"
  echo "✅ $f done"
done

# Atau satu per satu
psql -h postgres -U postgres -d sobat_pintar -f migrations/001_create_users.sql
```

### Reset Database (kalau mau mulai fresh)
```bash
psql -h postgres -U postgres -c "DROP DATABASE sobat_pintar;"
psql -h postgres -U postgres -c "CREATE DATABASE sobat_pintar;"
# Lalu jalankan migrations lagi
```

---

## 🔑 Environment Variables

File: `/workspace/backend/.env`

```env
# Server
APP_PORT=8080
APP_ENV=development

# Database (dalam Dev Container — gunakan nama service, bukan localhost)
DB_HOST=postgres        ← PENTING: bukan localhost
DB_PORT=5432
DB_NAME=sobat_pintar
DB_USER=postgres
DB_PASSWORD=postgres123

# Redis (dalam Dev Container — gunakan nama service)
REDIS_HOST=redis        ← PENTING: bukan localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Gemini AI
GEMINI_API_KEY=         ← dari aistudio.google.com (gratis)
GEMINI_MODEL=gemini-1.5-flash

# JWT Auth
JWT_SECRET=sobat-pintar-secret-2026
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Storage (Phase 4 — isi nanti)
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=sobat-pintar

# Firebase FCM (Phase 5 — isi nanti)
FIREBASE_PROJECT_ID=
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

> ⚠️ **Penting:** Kalau running di luar Dev Container (langsung di Mac),
> ganti `DB_HOST=postgres` → `DB_HOST=localhost`
> dan `REDIS_HOST=redis` → `REDIS_HOST=localhost`

---

## 🤖 Cara Pakai AI (Antigravity / Claude)

### Workflow Recommended
```
VSCode (Dev Container)     Antigravity (tanpa container)
├── go run server          ├── generate kode baru
├── npm run dev            ├── fix bug via agent
├── debug & test           ├── tanya pertanyaan
└── git commit             └── scaffold fitur baru
```

### Starter Prompt untuk Antigravity
Setiap buka conversation baru di Antigravity, paste ini:

```
Read CLAUDE.md first.

Current status: Phase 1 is complete and running.
Backend on :8080, Frontend on :3000, Dev Container active.

Today's task: [isi task yang mau dikerjakan]
```

### Tips Prompt yang Efektif
```
# Generate fitur baru
"Read CLAUDE.md. Implement Phase 2 — Latihan Soal backend:
practice handler, service, repository. Follow conventions in CLAUDE.md."

# Fix bug
"This error occurred: [paste error]. Fix it without breaking other files."

# Refactor
"Refactor [file] to follow the repository pattern in CLAUDE.md."
```

---

## 📝 Catatan Penting

### Hal yang Sering Terlupa

1. **DB_HOST harus `postgres`** (bukan `localhost`) saat pakai Dev Container
2. **Redis host harus `redis`** (bukan `localhost`) saat pakai Dev Container
3. **Docker Desktop harus running** sebelum Reopen in Container
4. **Buka terminal baru** untuk frontend — jangan pakai terminal yang sama dengan backend
5. **File `.env` tidak di-commit** ke Git — jangan lupa setup ulang di environment baru

### Port yang Dipakai
```
3000 → Frontend Next.js
8080 → Backend Go API
5432 → PostgreSQL
6379 → Redis (6380 di Mac kalau ada conflict)
```

### Credentials Default (Development Only)
```
PostgreSQL password : postgres123
JWT Secret         : sobat-pintar-secret-2026
```
> ⚠️ Ganti semua credentials ini sebelum deploy ke production!

### Git Workflow
```bash
# Sebelum mulai kerja
git pull origin develop

# Setelah selesai
git add .
git commit -m "feat: implement latihan soal feature"
git push origin develop
```

---

## 🚢 Deploy (Nanti)

### Backend → Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login & deploy
railway login
railway up
```

### Frontend → Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

> Pastikan environment variables sudah diset di Railway & Vercel dashboard
> sebelum deploy. Jangan hardcode credentials!