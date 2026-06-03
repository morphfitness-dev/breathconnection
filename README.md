# The Breath Connection

A personalised 8-week breathing programme app for guided trial participants.

Users complete a multi-step onboarding assessment that assigns them to one of four evidence-based breathing programmes (HRV Optimisation, Anxiety Management, Cardiovascular Endurance, or Sleep Improvement). Each programme delivers 8 weekly sessions across four phases, combining biomechanics, biochemistry, and neurophysiology. Progress is tracked via BOLT scores, daily wellbeing check-ins, and session completion history.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Video delivery:** Mux
- **Email:** Resend

## Running Locally

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and configure

```bash
git clone https://github.com/morphfitness-dev/breathconnection.git
cd breathconnection
git checkout claude/gifted-turing-Eb3gx

# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

Fill in your Supabase URL, anon key, and service role key in both `.env` files.

### 2. Run database migrations

In your **Supabase SQL Editor**, run these files in order:
1. `server/db/001_users_profile.sql`
2. `server/db/002_assessments.sql`
3. `server/db/003_sessions_and_checkins.sql`
4. `server/db/003b_mux_index.sql`
5. `server/db/005_admin.sql`

### 3. Install and start

```bash
# Terminal 1 — frontend (http://localhost:3000)
cd client && npm install && npm run dev

# Terminal 2 — backend (http://localhost:4000)
cd server && npm install && npm run dev
```

## Admin Panel

The admin panel is at `/admin`. To grant access:

```sql
UPDATE users_profile SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

From the admin panel you can: view all users with progress and flags, see full assessment responses and session history, send trial invites with generated codes, and export user data to CSV.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production deployment instructions (Vercel + Railway/Render).

## Colour Palette

| Role | Hex |
|---|---|
| Primary (deep teal) | `#0D5C63` |
| Background (off-white) | `#FAF8F5` |
| Accent (soft amber) | `#E8A87C` |

## Typography

- Headings: DM Serif Display
- Body: DM Sans
