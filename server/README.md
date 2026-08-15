# AUST Central — API Server

Node + Fastify + PostgreSQL backend for the AUST Central app. Plain JavaScript (ESM), Prisma for data access, Zod for runtime validation.

This server is replacing Firebase entirely: it owns identity and every feature's data. See the app's [README](../README.md) for the wider project.

## Requirements

- Node 22+ (developed on 24)
- Docker (for PostgreSQL)

## Quick start

```bash
cd server
npm install

cp .env.example .env          # then fill in the two secrets — see below
docker compose up -d postgres postgres-test
npm run db:migrate
npm run dev                   # http://localhost:3000
```

Generate the two required secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`JWT_ACCESS_SECRET` and `PASSWORD_PEPPER` must each be at least 32 characters **and differ from each other**. The server validates its whole environment at boot and refuses to start if anything is missing, short, or (in production) unsafe — a server running on a default signing key is worse than one that will not start.

> **Port note:** the dev database is published on **5434**, not 5432, so it cannot collide with a PostgreSQL already installed on your machine. The test database is on 5433.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with file watching |
| `npm start` | Start once |
| `npm run lint` | ESLint — the main static gate, since there is no compiler |
| `npm test` | Vitest against the test database |
| `npm run db:migrate` | Create + apply a migration from schema changes |
| `npm run db:deploy` | Apply existing migrations (CI / production) |
| `npm run db:reset` | Drop and rebuild the dev database |
| `npm run db:studio` | Prisma's data browser |

Tests need `postgres-test` running; the suite applies migrations itself before the first file.

## Layout

```text
src/
  server.js          entrypoint — listen + graceful shutdown
  app.js             buildApp(): assembles plugins and routes
  config/            env.js (validated at boot), logger.js (with redaction)
  plugins/           errors, security, prisma, auth — registered in that order
  modules/<domain>/  routes.js · service.js · schema.js
  lib/               errors, crypto, pagination, validation, mailer
prisma/              schema.prisma + migrations
test/                integration tests driven through fastify.inject()
```

Every feature module has the same three files. `routes.js` declares HTTP shape and Zod schemas, `service.js` holds business logic **and every ownership check**, `schema.js` defines the contracts. Adding a feature should never require inventing a new pattern.

## Security posture

The parts that are easy to regress, and why they are the way they are:

**Passwords** — argon2id (64 MiB, t=3) plus a server-side pepper from the environment. The pepper never touches the database, so a stolen dump alone cannot be attacked offline. Hashes are transparently upgraded on login when the cost parameters are raised.

**Sessions** — 15-minute access JWTs (HS256, algorithm pinned to block `alg:none` and confusion attacks) and 30-day opaque refresh tokens stored only as SHA-256. Refresh is **single-use with rotation**; replaying a spent token revokes the entire token family and writes an audit entry, on the assumption that a replay means the token leaked.

**Account enumeration** — login returns one identical response for "wrong password" and "no such account", and pays the cost of a real hash either way so timing does not give it away. `/forgot-password` answers the same for known and unknown addresses, and mail failures are swallowed rather than surfaced as 500s, since that difference would itself be a signal. (Registration is the deliberate exception: it must tell you the address is taken.)

**Lockout** — five failed attempts locks an account for 15 minutes. Held on the user row, not just in the rate limiter, so rotating source IPs does not reset it.

**Validation** — Zod on body, params, query **and responses**. The response schema is an allowlist: anything not named in it is stripped before serialisation, which is what structurally prevents `passwordHash` from ever reaching a client. On plain JavaScript these schemas are the only type safety there is.

**Authorisation** — RBAC via `requireRole`, but ownership checks live in the service layer. Every user-owned query filters by the token's user id; no endpoint trusts a path id alone. Ownership failures return **404, not 403** — a 403 would confirm the row exists.

**Database** — integrity rules that must not depend on application code live in the schema as CHECK constraints (price/type pairing, rating range, no self-review, time formats). Primary keys are UUIDs so one id cannot be incremented into a neighbour's.

**Transport** — helmet with a `default-src 'none'` CSP, CORS restricted to an explicit allowlist (never `*` in production), HSTS in production only, refresh cookie `httpOnly` + `sameSite=strict` + path-scoped to the auth routes.

**Logging** — pino with redaction of authorization headers, cookies, and every password/token field. Errors are logged in full and returned opaquely: only deliberate `AppError`s describe themselves to the client, so Prisma and driver messages cannot leak.

## API

Base path `/api/v1`. Probes (`/health`, `/ready`) sit at the root, unauthenticated and exempt from rate limiting.

Implemented:

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/register` | Returns a session; sends a verification email |
| POST | `/auth/login` | Rate limited, lockout after 5 failures |
| POST | `/auth/refresh` | Rotates; detects reuse |
| POST | `/auth/logout` | Revokes the token family |
| POST | `/auth/forgot-password` | Enumeration-safe |
| POST | `/auth/reset-password` | Single-use token; revokes all sessions |
| POST | `/auth/verify-email` | |
| POST | `/auth/resend-verification` | |
| GET | `/auth/me` | Re-checks the user against the database |
| PATCH | `/auth/password` | Revokes all sessions on success |

Mobile clients read `refreshToken` from the JSON body and store it in the OS keychain; browsers use the httpOnly cookie and ignore the body copy.

The remaining modules — tasks, class reminders, CGPA, lab reports, notices, blood bank, book exchange, lost & found, transport, notifications, files — follow the same `routes.js`/`service.js`/`schema.js` pattern. See [README.md § 8](../README.md#8-api-reference) for the full endpoint list.

## Errors

Every failure has the same shape:

```json
{
  "error": { "code": "VALIDATION_FAILED", "message": "Validation failed",
             "details": { "fields": { "password": ["..."] } } },
  "requestId": "0789cd42-cb8d-488a-b800-b8a04e2d64cb"
}
```

`requestId` appears on every log line for that request, so a user-reported failure can be found without guesswork.
