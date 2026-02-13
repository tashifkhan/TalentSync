# syntax=docker/dockerfile:1.7

############################################
# Stage 0: deps (dev deps for build tooling)
############################################
FROM oven/bun:1 AS deps

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/home/bun/.bun/install/cache \
    bun install --frozen-lockfile


############################################
# Stage 1: builder (next build + prisma generate)
############################################
FROM oven/bun:1 AS builder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_UI_HOST
ARG NEXT_PUBLIC_POSTHOG_HOST

ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_UI_HOST=$NEXT_PUBLIC_POSTHOG_UI_HOST \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lock ./bun.lock
COPY --from=deps /app/prisma ./prisma

COPY . .

# `bun run build` should NOT run migrations (fixed in package.json below)
RUN bun run build


############################################
# Stage 2: prod-deps (only production deps)
############################################
FROM oven/bun:1 AS prod-deps

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/home/bun/.bun/install/cache \
    bun install --production --frozen-lockfile


############################################
# Stage 3: migrate (one-shot migrations)
############################################
FROM deps AS migrate

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Only migrations by default (safe for production).
# If you want seed here, you MUST run `prisma generate` before seed:
# bunx prisma migrate deploy && bunx prisma generate && bun run seed
CMD ["sh", "-lc", "bunx prisma migrate deploy"]


############################################
# Stage 4: runner (runtime)
############################################
FROM oven/bun:1-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p /app && chown bun:bun /app
USER bun
WORKDIR /app

COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=prod-deps --chown=bun:bun /app/package.json ./package.json
COPY --from=prod-deps --chown=bun:bun /app/bun.lock ./bun.lock
COPY --from=prod-deps --chown=bun:bun /app/prisma ./prisma

COPY --from=builder --chown=bun:bun /app/.next ./.next
COPY --from=builder --chown=bun:bun /app/public ./public

# If your config is next.config.mjs/ts, tell me and I’ll adjust this line.
COPY --from=builder --chown=bun:bun /app/next.config.js ./next.config.js

# Prisma generated runtime bits (engines/client)
COPY --from=builder --chown=bun:bun /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["bun", "run", "start"]
