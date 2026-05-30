# The Breath Connection — Web App

## Project Structure

```
/client   — React + Vite + Tailwind frontend
/server   — Node.js + Express backend
```

## Getting Started

### 1. Configure environment variables

```bash
# Client
cp client/.env.example client/.env
# Server
cp server/.env.example server/.env
```

Fill in your Supabase project URL, anon key, and service role key from the Supabase dashboard.

### 2. Set up the database

Run `/server/db/001_users_profile.sql` in your Supabase SQL editor.

### 3. Install dependencies and run

```bash
# Terminal 1 — frontend
cd client && npm install && npm run dev

# Terminal 2 — backend
cd server && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Colour Palette

| Token | Hex |
|-------|-----|
| Primary (deep teal) | `#0D5C63` |
| Background (off-white) | `#FAF8F5` |
| Accent (soft amber) | `#E8A87C` |

## Typography

- Headings: DM Serif Display
- Body: DM Sans
