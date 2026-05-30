# The Breath Connection — Web App

React + Vite frontend with a Node/Express backend, authenticated via Supabase.

## Project Structure

```
breath-connection/
  client/   — React + Vite + Tailwind CSS
  server/   — Express + TypeScript
  README.md
```

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run `server/db/001_users_profile.sql`
3. Copy your project URL, anon key, and service-role key from **Settings → API**

### 2. Client

```bash
cd client
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
# → http://localhost:5173
```

### 3. Server

```bash
cd server
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
npm install
npm run dev
# → http://localhost:3001
```

## Auth Flow

- `POST /api/me` — Returns `{ id, email }` for the authenticated user
- Supabase JWT is verified on every protected route via `requireAuth` middleware
- Client stores session automatically via `@supabase/supabase-js`

## Colour Palette

| Token | Hex |
|---|---|
| Primary (teal) | `#0D5C63` |
| Background | `#FAF8F5` |
| Accent (amber) | `#E8A87C` |

## Fonts

- **DM Serif Display** — headings
- **DM Sans** — body text
