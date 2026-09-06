# The Register — Church Attendance Management System

A full-stack app to take attendance, flag members who've stopped coming, and
show attendance totals/trends.

**Stack:** React (Vite) frontend · Node/Express API · PostgreSQL

## Why this stack
- **Postgres** gives real transactional safety, which matters here: a `UNIQUE(member_id, service_id)`
  constraint on the `attendance` table means multiple ushers can mark the same person at the same
  time without double-counting or crashing — the second mark is just ignored, not an error.
- **Express** keeps the API layer thin and easy to reason about — each route is a small, readable file.
- **React** for the attendance-marking screen, since it's a UI you tap through repeatedly every week.

## Project structure
```
church-attendance/
  backend/
    src/
      db/          schema.sql, seed.sql, pool.js
      routes/       members, services, attendance, dashboard, flag job trigger
      jobs/         flagAbsentees.js — the absence-flagging logic
      server.js
  frontend/
    src/
      pages/         RollCall.jsx, Dashboard.jsx, Members.jsx
      api.js          fetch wrapper for the backend
      App.jsx, styles.css
```

## How the absence flagging works
Every active member is checked against the most recent N Sunday services
(N = `ABSENCE_STREAK_THRESHOLD`, default 3). If they have no attendance
record for ANY of those N services, they get a flag in the `flags` table
(if one isn't already open). Leadership sees flags on the Dashboard and can
mark them "followed up" once someone's reached out.

Run it manually via the "Run flag check" button on the dashboard, or wire
`flagAbsentees.js` into a weekly cron job (e.g. with `node-cron`, or a real
system cron calling a small script) so it runs automatically every Monday.

## Setup

### 1. Database
```bash
createdb church_attendance
cd backend
cp .env.example .env        # adjust DB credentials if needed
psql church_attendance -f src/db/schema.sql
psql church_attendance -f src/db/seed.sql   # optional sample data
```

### 2. Backend
```bash
cd backend
npm install
npm run dev      # starts on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to :4000
```

Open http://localhost:5173 — you should see three tabs: Mark attendance,
Dashboard, Members.

## Next features to add (see project plan)
- First-timer / visitor tracking with follow-up reminders
- SMS/email notifications when a flag is created (e.g. via Twilio)
- Auth + roles (admin / dept_head / usher) so ushers log in before marking
- QR-code self check-in at the door
- Exportable monthly PDF/Excel report for leadership

## A note on the design
The UI leans into a "ledger / Sunday bulletin" look — warm paper tones,
a serif display face (Fraunces) for headings, brass and sage accents for
present/flagged states — rather than a generic admin dashboard, since this
is a tool people will use standing at a church door, not staring at a SaaS
panel.
