# Deploying The Breath Connection

## Architecture

```
mobile (Expo/React Native)
       │
       ▼ HTTPS
breathconnection-api  (Node/Express in Docker)
       │
       ▼
PostgreSQL 16
       │
       ▼ (optional)
S3 / Cloudflare R2  (video files)
```

---

## Backend — Deploy to Render.com (recommended)

### One-click deploy
1. Push this repo to GitHub / GitLab
2. Go to https://render.com → New → Blueprint
3. Point it at your repo — Render reads `render.yaml` automatically
4. It provisions: a Docker web service + a PostgreSQL 16 database
5. `DATABASE_URL` is wired automatically; `JWT_SECRET` is auto-generated
6. First deploy runs `prisma migrate deploy` then starts the server

### Environment variables to add manually in the Render dashboard
| Key | Value |
|-----|-------|
| `S3_BUCKET` | Your S3 or R2 bucket name (for video uploads) |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Your IAM key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret |
| `CDN_BASE` | CloudFront or R2 custom domain (optional) |

### After deploy
- Health check: `https://breathconnection-api.onrender.com/health`
- Update `mobile/app.json` → `extra.apiUrlProd` with your Render URL
- Run a new EAS build so the mobile app hits the live API

---

## Backend — Local full-stack with Docker Compose

Requires Docker Desktop (or Docker Engine + Compose plugin).

```bash
# Copy and fill in secrets
cp backend/.env.example backend/.env

# Start Postgres + API (runs migrations automatically)
docker compose up --build

# API available at http://localhost:3000
# Health: curl http://localhost:3000/health
```

To stop: `docker compose down` (add `-v` to also wipe the database volume)

---

## Mobile — EAS Build

### Prerequisites
- Expo account: https://expo.dev/signup
- `npm install -g eas-cli`
- Apple Developer account ($99/yr) for iOS
- Google Play Console account ($25 one-time) for Android

### One-time setup
```bash
cd mobile
eas login
eas project:init
```
Copy the `projectId` it prints into:
- `mobile/app.json` → `expo.extra.eas.projectId`
- `mobile/app.json` → `expo.updates.url`

### Android push notifications — Firebase
1. Create project at https://console.firebase.google.com
2. Add Android app with package `com.breathconnection.app`
3. Download `google-services.json` → replace `mobile/google-services.json`

### Build commands

| Goal | Command |
|------|---------|
| Test on simulator | `eas build --profile development --platform ios` |
| Internal APK (Android testers) | `eas build --profile preview --platform android` |
| TestFlight (iOS testers) | `eas build --profile preview --platform ios` |
| App Store + Play Store | `eas build --profile production --platform all` |

### Submit to stores
```bash
eas submit --platform ios --latest     # → App Store Connect
eas submit --platform android --latest # → Google Play Console
```

### Push OTA JS updates (no store review needed)
```bash
eas update --channel production --message "Fix: description"
```

---

## After first production deploy — checklist

- [ ] `mobile/app.json` `apiUrlProd` points to Render URL
- [ ] `mobile/app.json` EAS `projectId` filled in
- [ ] `mobile/google-services.json` replaced with real Firebase file
- [ ] S3/R2 bucket created and env vars set in Render
- [ ] Domain `api.breathconnection.com` CNAME'd to Render service URL
- [ ] SSL cert issued (Render does this automatically)
- [ ] Run `eas build --profile production --platform all`
- [ ] Submit to TestFlight for internal testing before public release
