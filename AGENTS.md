# Sobat Pintar — AGENTS.md

> AI context file for Codex / Continue.dev
> Last updated: May 2026

---

## Project Overview

**Sobat Pintar** is an AI-powered learning platform for Indonesian students (TK to SMA).
The app acts as a friendly AI study companion ("teman belajar").
Mascot: **Sobi** — a friendly small robot, teal colored.

**Tagline:** *"Teman belajar AI untuk semua pelajar Indonesia"*

---

## Coding Conventions

- Commit messages: lowercase with prefix (`feat:`, `fix:`, `refactor:`, `chore:`)
- Comments and docs: **English**
- UI text and user-facing strings: **Bahasa Indonesia**
- Prefer minimal, focused changes over large rewrites
- Single responsibility per handler/service function
- Always handle errors explicitly — no silent failures
- Use structured logging (zerolog)

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

## Workflow AI

```text
VSCode
├── running backend/frontend
├── debugging
├── testing
└── git operations

Codex / Antigravity
├── generate feature
├── refactor
├── scaffold
└── code review
```

### Starter Prompt
```
Read AGENTS.md first.

Current status:
- Dev Container active
- Backend on :8080
- Frontend on :3000

Today's task:
[isi task]
```
