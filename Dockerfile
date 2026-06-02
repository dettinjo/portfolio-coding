FROM node:20-alpine AS base

# ── deps: install all node_modules (including devDeps for the build) ──────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Keep NODE_ENV=development so devDependencies are always installed,
# regardless of what Coolify or CI injects as a build arg.
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ── builder: compile the Next.js + Payload app ────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
# Provide safe defaults so the build works in CI without explicit --build-arg.
ARG NEXT_PUBLIC_FULL_NAME="Joel Dettinger"
ARG NEXT_PUBLIC_EMAIL_ADDRESS=""
ARG NEXT_PUBLIC_PHONE_NUMBER=""
ARG NEXT_PUBLIC_STREET_ADDRESS=""
ARG NEXT_PUBLIC_CITY_ADDRESS=""
ARG NEXT_PUBLIC_GITHUB_USERNAME="dettinjo"
ARG NEXT_PUBLIC_LINKEDIN_USERNAME="joeldettinger"
ARG NEXT_PUBLIC_INSTAGRAM_USERNAME="joeldettinger"
ARG NEXT_PUBLIC_SERVER_URL="https://codeby.joeldettinger.de"

ENV NEXT_PUBLIC_FULL_NAME=$NEXT_PUBLIC_FULL_NAME
ENV NEXT_PUBLIC_EMAIL_ADDRESS=$NEXT_PUBLIC_EMAIL_ADDRESS
ENV NEXT_PUBLIC_PHONE_NUMBER=$NEXT_PUBLIC_PHONE_NUMBER
ENV NEXT_PUBLIC_STREET_ADDRESS=$NEXT_PUBLIC_STREET_ADDRESS
ENV NEXT_PUBLIC_CITY_ADDRESS=$NEXT_PUBLIC_CITY_ADDRESS
ENV NEXT_PUBLIC_GITHUB_USERNAME=$NEXT_PUBLIC_GITHUB_USERNAME
ENV NEXT_PUBLIC_LINKEDIN_USERNAME=$NEXT_PUBLIC_LINKEDIN_USERNAME
ENV NEXT_PUBLIC_INSTAGRAM_USERNAME=$NEXT_PUBLIC_INSTAGRAM_USERNAME
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

# PAYLOAD_SECRET and POSTGRES_URL are runtime-only — never bake secrets
# into the image. They are injected at container startup via env vars.

RUN npm run build

# ── runner: minimal production image ─────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && apk add --no-cache curl

COPY --from=builder /app/public ./public

RUN mkdir -p .next public/media data \
 && chown -R nextjs:nodejs .next public/media data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Payload needs the native libsql binary and drizzle-kit at runtime
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-kit ./node_modules/drizzle-kit

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
