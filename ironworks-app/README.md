# Ironworks Coaching

Scaffold for the Ironworks Coaching web app.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database + Auth:** Supabase (`@supabase/ssr`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project's values (Project Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to the client)

### 3. Run the database migration

In the Supabase SQL editor, run `supabase/migrations/001_users_profile.sql`. This creates
the `users_profile` table, its row-level security policy, and a trigger that
auto-populates a profile row whenever a new `auth.users` row is created.

### 4. Create accounts

There is no public sign-up page.

- **Coach accounts** are created directly in the Supabase dashboard (Authentication →
  Users → Add User). Set the user's metadata to `{ "full_name": "...", "role": "coach" }`
  so the profile trigger assigns the coach role automatically.
- **Client accounts** are created via an invite flow (not built yet).

### 5. Run the app

```bash
npm run dev
```

Visit http://localhost:3000. Logged-out users are sent to `/login`. After login, coaches
land on `/coach` and clients land on `/client`; middleware enforces that a user can only
reach the area matching their role.

## Project Structure

```
/app                    App Router routes (/, /login, /coach, /client)
/components             Shared UI components
/lib/supabase           Browser, server, and middleware Supabase clients
/lib/types.ts           Shared TypeScript types
/supabase/migrations    SQL migrations
middleware.ts           Role-based route protection
```

## Design

Dark, athletic aesthetic: graphite background (`#111417`), iron-orange accent
(`#E4572E`), off-white text (`#F3F1EB`). Headings use Oswald (uppercase), body copy uses
Inter, and numeric data (sets/reps/weights) uses JetBrains Mono.
