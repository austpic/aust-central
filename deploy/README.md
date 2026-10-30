# Deploying AUST Central

One host, four containers, one public origin:

```text
              https://DOMAIN
                    │
            ┌───────▼────────┐  TLS (automatic certificates), security headers
            │  web (Caddy)   │  /api/*  → api:3000
            │                │  /*      → the built web client (SPA)
            └───────┬────────┘
                    │ internal network only
            ┌───────▼────────┐        ┌──────────────┐
            │  api (Fastify) ├────────►   postgres   │  no published port
            └───────┬────────┘        └──────────────┘
                    │
              uploads volume           migrate: runs `prisma migrate deploy`,
                                       exits; api starts only if it succeeded
```

Serving the web client and the API from the same origin is deliberate: it is
what lets the refresh-token cookie stay `HttpOnly; Secure; SameSite=Strict`.
The mobile app talks to `https://DOMAIN/api/v1` directly.

## Requirements

- A Linux host with Docker Engine and the Compose plugin.
- A DNS record for `DOMAIN` pointing at the host; ports **80 and 443** open
  (Caddy needs both to obtain and renew the certificate).
- An SMTP account for outbound mail. Password reset and email verification
  do not work without it, so the API refuses to boot without `SMTP_HOST`.

## First deploy

```bash
cd deploy
cp .env.example .env        # fill in EVERY value — see comments in the file
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps   # migrate: Exited (0), api: healthy
```

If the API exits immediately, `docker compose -f docker-compose.prod.yml logs api`
prints exactly which variables are missing or unsafe. Production refuses to
start with plain-http URLs, a wildcard CORS origin, a reused secret, missing
SMTP, or `TRUST_PROXY=true`.

### Bootstrap data

The demo seed (`npm run db:seed`) refuses to run in production — it creates
accounts with a published password. Instead:

```bash
C="docker compose -f docker-compose.prod.yml run --rm --no-deps"

# 1. First staff account (prints a one-time password; change it after sign-in).
#    ADMIN or MODERATOR can post notices. Re-run with an existing address to
#    change its role; that signs the account out everywhere.
$C api npm run admin:create -- --email registrar@aust.edu --name "Registrar Office"

# 2. Campus transport. There is no admin UI for buses, so it is loaded from a
#    file. Start from server/prisma/transport.example.json — its driver
#    numbers are placeholders — and re-run whenever the schedule changes.
$C -v ./transport.json:/app/transport.json:ro api npm run transport:load -- transport.json
```

## Updating

```bash
git pull
cd deploy
F="-f docker-compose.prod.yml"
docker compose $F build
docker compose $F run --rm migrate && docker compose $F up -d
```

Run the migration as its own step, exactly as above. A plain `up -d --build`
**replaces the running API container before** it learns the migration
failed, leaving the site down (502) until someone intervenes. With the gated
form, a failed migration stops the command and the old API keeps serving
(tested: old container untouched, still answering 200).

**Take a backup before any release that contains a migration**
(`server/prisma/migrations/`).

## Backups

Two things hold state: the database and the `uploads` volume.

```bash
# Database
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U aust -d aust_central --format=custom > aust-$(date +%F).dump

# Uploaded files
docker run --rm -v aust-central_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tgz -C /data .
```

Run both on a schedule (cron) and copy the results **off the host**.
`deploy/.env` must be backed up separately and kept secret: without the same
`PASSWORD_PEPPER`, no stored password can ever be verified again.

Restore:

```bash
docker compose -f docker-compose.prod.yml stop api
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U aust -d aust_central --clean --if-exists < aust-YYYY-MM-DD.dump
docker run --rm -v aust-central_uploads:/data -v "$PWD":/backup alpine \
  sh -c 'cd /data && tar xzf /backup/uploads-YYYY-MM-DD.tgz'
docker compose -f docker-compose.prod.yml start api
```

## Operating notes

- **Logs** are JSON on stdout (`docker compose … logs -f api`); credentials,
  cookies, and tokens are redacted. Every error response carries a
  `requestId` that matches the log line.
- **Health**: the API container has a Docker healthcheck on `/health`;
  `/ready` additionally checks the database. Neither is exposed publicly.
- **Scaling**: this is a single-instance design. Rate limits are kept in
  memory and uploads on a local volume, so running several API replicas
  needs a shared rate-limit store (Redis) and object storage first.
- **Secrets rotation**: rotating `JWT_ACCESS_SECRET` signs everyone out at
  most 15 minutes later (access-token lifetime); it is safe at any time.
  Never rotate `PASSWORD_PEPPER`.
