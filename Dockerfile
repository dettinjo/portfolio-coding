FROM node:20-alpine AS base

# ── deps: install all node_modules (including devDeps for the build) ──────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Keep NODE_ENV=development so devDependencies are always installed,
# regardless of what Coolify or CI injects as a build arg.
ENV NODE_ENV=development
# Tell puppeteer to skip downloading its own Chrome — we use the system one.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ── builder: compile the Next.js app ─────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# All personalization (name, socials, address, SEO, legal, serverUrl) is read
# from the generated src/data/site.config.json — produced by fetch-portfolio.ts
# during `npm run build` from the portfolio-config repo (or the committed
# example fallback). No NEXT_PUBLIC_* build args are needed.

# CACHEBUST forces the npm run build layer to re-run when project-repo data
# changes (repository_dispatch builds). Pass a unique value (e.g. timestamp)
# to bust the cache; leave empty / omit for normal cached builds.
ARG CACHEBUST=1

# GITHUB_TOKEN is mounted as a BuildKit secret for the build step only.
# It lets fetch-portfolio.ts access GitHub repos and download project images.
# The secret is never stored in any image layer.
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN=$(cat /run/secrets/GITHUB_TOKEN 2>/dev/null || true) \
    npm run build

# ── runner: minimal production image ─────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && apk add --no-cache curl \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Tell puppeteer to use the system Chromium rather than a downloaded one.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/public ./public

RUN mkdir -p .next \
 && chown -R nextjs:nodejs .next public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Puppeteer needs its own node_modules in the standalone output
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/puppeteer ./node_modules/puppeteer

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
