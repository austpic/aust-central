# syntax=docker/dockerfile:1

# AUST Central API — production image.
#
#   docker build -t aust-central-api server/
#
# Runs `node src/server.js` as the unprivileged `node` user. Migrations are a
# separate one-shot command (`npx prisma migrate deploy`) so a crash-looping
# replica can never re-run them; deploy/docker-compose.prod.yml wires that up.

FROM node:22-bookworm-slim AS base
# Prisma's engines link against OpenSSL; slim images do not ship it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

FROM base
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    STORAGE_DIR=/app/storage \
    # Configuration comes from the orchestrator, never a baked-in .env.
    SKIP_DOTENV=1

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# Created and chowned here so a fresh named volume mounted on it inherits a
# directory the service user can write to.
RUN mkdir -p /app/storage && chown node:node /app/storage
VOLUME ["/app/storage"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "src/server.js"]
