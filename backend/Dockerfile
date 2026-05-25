# ── Stage 1: build ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests — lock file is at repo root (monorepo), passed via context
COPY package-lock.json ./
COPY backend/package.json ./package.json
COPY backend/prisma ./prisma/

RUN npm ci --ignore-scripts && npx prisma generate

COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src/
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package-lock.json ./
COPY backend/package.json ./package.json
COPY backend/prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
