# Building & Submitting The Breath Connection

## Prerequisites
- Expo account: https://expo.dev/signup
- EAS CLI: `npm install -g eas-cli`
- Apple Developer account (iOS)
- Google Play Console account (Android)

## One-time setup

### 1. Log in to EAS
```bash
eas login
```

### 2. Create the EAS project
```bash
cd mobile
eas project:init
```
Copy the projectId it prints into:
- `mobile/app.json` → `expo.extra.eas.projectId`
- `mobile/app.json` → `expo.updates.url` (replace the placeholder)

### 3. Android — Firebase / Google Services
- Go to Firebase Console → Add project → "breathconnection"
- Add Android app with package name `com.breathconnection.app`
- Download `google-services.json` and replace `mobile/google-services.json`

### 4. Credentials (EAS manages these automatically)
```bash
eas credentials
```
EAS will generate and store your iOS provisioning profiles and Android keystore.

---

## Building

### Development build (runs on simulator / device via Expo Dev Client)
```bash
cd mobile
eas build --profile development --platform ios     # or android
```

### Preview build (internal testing, no store submission)
```bash
eas build --profile preview --platform all
```
Sends a sharable install link to testers via email.

### Production build
```bash
eas build --profile production --platform all
```

---

## OTA Updates (after first build)

Push a JS-only update without going through the store review:
```bash
eas update --channel production --message "Fix: ..."
```
The app checks for updates on every launch (configured in `app.json`).

---

## Submitting to stores

### App Store (iOS)
```bash
eas submit --platform ios --latest
```
Requires Apple ID, App Store Connect App ID, and Team ID in `eas.json`.

### Google Play (Android)
```bash
eas submit --platform android --latest
```
Requires a Google Play service account JSON key at `mobile/google-play-service-account.json`.

---

## Environment variables per build profile

| Variable     | development          | preview/production                      |
|--------------|----------------------|-----------------------------------------|
| `API_URL`    | http://localhost:3000 | https://api.breathconnection.com        |
| `NODE_ENV`   | development          | production                              |

Set secrets (JWT keys, API keys) via:
```bash
eas secret:create --scope project --name JWT_SECRET --value "..."
```
