# ── Stage 1: build ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY backend/package.json ./package.json
COPY backend/prisma ./prisma/

RUN npm install --ignore-scripts && npx prisma generate

COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src/
RUN npm run build

RUN npm prune --omit=dev

# ── Stage 2: production image ─────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY backend/package.json ./package.json

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
