# ── Stage 1: build ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests first so npm install is cached unless deps change
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts && npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Install production deps only (postinstall runs prisma generate)
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Local uploads dir (used when S3 is not configured)
RUN mkdir -p uploads

EXPOSE 3000

# Run migrations then start — DATABASE_URL must be set at runtime
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
