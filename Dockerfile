# Multi-stage Dockerfile para AUTOPOST.
#
# Reemplazo opcional de Nixpacks. Para activarlo en Railway, cambiar railway.toml:
#   [build]
#   builder = "DOCKERFILE"
#   dockerfilePath = "Dockerfile"
#
# Beneficio principal: cache de capas. Solo se rebuilda lo que cambia:
#   - Cambias código → builder + runner (deps cached, ~30s en deps)
#   - Cambias package.json → todo (igual que Nixpacks actual)
#
# Probar localmente antes de migrar producción:
#   docker build -t autopost:test .
#   docker run -p 8080:8080 --env-file .env autopost:test

# ============================================================
# Stage 1: deps — instala node_modules (capa cacheable)
# ============================================================
FROM node:22.11.0-slim AS deps
WORKDIR /app

# OpenSSL necesario para Prisma engines
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

# npm ci es estricto con package-lock.json (falla si hay drift)
RUN npm ci --no-audit --no-fund

# ============================================================
# Stage 2: builder — Prisma generate + Next build
# ============================================================
FROM node:22.11.0-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client + Next.js standalone bundle
RUN npx prisma generate
RUN npm run build

# ============================================================
# Stage 3: runner — imagen final mínima
# ============================================================
FROM node:22.11.0-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Crear usuario no-root para correr la app
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Bundle standalone de Next.js (incluye node_modules curado por Next)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# El worker BullMQ corre con tsx → necesita src/ + tsx + node_modules completos.
# Por eso copiamos node_modules entero del builder, no solo el subset standalone.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json

USER nextjs

EXPOSE 8080

# scripts/start.js levanta Next.js standalone + Worker BullMQ
CMD ["node", "scripts/start.js"]
