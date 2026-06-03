# The Breath Connection — Deployment Guide

## Overview

The app has two parts:
- **Client** — React + Vite app, deployed to Vercel
- **Server** — Node.js + Express API, deployed to Railway or Render

Both connect to a shared Supabase project (PostgreSQL + Auth).

---

## 1. Supabase Setup (Production)

1. Create a new project at [supabase.com](https://supabase.com) (separate from development).
2. Go to **SQL Editor** and run each migration file in order:
   - `server/db/001_users_profile.sql`
   - `server/db/002_assessments.sql`
   - `server/db/003_sessions_and_checkins.sql` — this seeds all 32 programme sessions
   - `server/db/003b_mux_index.sql`
   - `server/db/005_admin.sql`
3. From **Settings → API**, copy:
   - Project URL → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY` (keep secret — server only)

---

## 2. Deploy the Backend (Railway or Render)

### Railway
1. Connect your GitHub repo to [railway.app](https://railway.app).
2. Set the root directory to `server/`.
3. Set start command: `npm start`
4. Add all server environment variables (see checklist below).
5. Copy the deployed URL (e.g. `https://your-app.railway.app`).

### Render
1. Create a new **Web Service** at [render.com](https://render.com).
2. Connect your GitHub repo, root directory: `server/`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all server environment variables.
6. Copy the deployed URL.

---

## 3. Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo.
2. Set **Root Directory** to `client/`.
3. Framework preset: **Vite**.
4. Add all client environment variables (see checklist below).
5. Set `VITE_API_URL` to your deployed backend URL from Step 2.
6. Deploy.

---

## 4. Configure Mux Webhooks

1. Go to [Mux Dashboard](https://dashboard.mux.com) → Settings → Webhooks.
2. Add a new webhook pointing to: `https://your-backend-url/api/webhooks/mux`
3. Copy the webhook signing secret → `MUX_WEBHOOK_SECRET`

---

## 5. Set Up First Admin User

After deploying and signing up with your account, run this in the **Supabase SQL Editor**:

```sql
UPDATE users_profile SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

Then visit `https://your-app.vercel.app/admin` to access the admin panel.

---

## 6. Trial Mode

Set `TRIAL_MODE=true` on the server to require invite codes at sign-up.
Use the admin panel (`/admin` → Invite User) to generate and email invite codes.

Set `VITE_TRIAL_MODE=true` on the client as well so the sign-up form shows the invite code field as required.

---

## 7. Environment Variable Checklist

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Backend URL (e.g. `https://your-app.railway.app`) |
| `VITE_TRIAL_MODE` | `true` or `false` — whether invite code is required at sign-up |

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (secret — never expose to frontend) |
| `MUX_TOKEN_ID` | Mux API token ID (from Mux Dashboard → Settings → API Tokens) |
| `MUX_TOKEN_SECRET` | Mux API token secret |
| `MUX_WEBHOOK_SECRET` | Mux webhook signing secret |
| `RESEND_API_KEY` | Resend API key for sending invite emails |
| `CLIENT_URL` | Frontend URL (e.g. `https://your-app.vercel.app`) |
| `TRIAL_MODE` | `true` or `false` |
| `PORT` | Server port (Railway/Render set this automatically) |

---

## 8. Post-Deployment Checks

- [ ] Sign up as a new user → onboarding assessment completes → dashboard loads
- [ ] Session player opens and breath pacer works
- [ ] Daily check-in saves and appears on Progress screen
- [ ] Admin panel accessible after granting is_admin
- [ ] Mux webhook reaches the server (check Mux dashboard → webhook logs)
- [ ] Invite flow works end-to-end (admin sends invite → user signs up with code)
