# AUST Central — Complete Technical Documentation

Campus companion app for students of Ahsanullah University of Science and Technology, plus the backend that serves it.

**Last verified:** 15 August 2026 · `flutter analyze` 0 errors · `npm run lint` clean · **74 server tests passing** · debug APK builds

---

## Table of contents

1. [What this is](#1-what-this-is)
2. [Architecture](#2-architecture)
3. [Repository layout](#3-repository-layout)
4. [Getting started](#4-getting-started)
5. [Configuration](#5-configuration)
6. [Data model](#6-data-model)
7. [API reference](#7-api-reference)
8. [Security design](#8-security-design)
9. [Flutter app structure](#9-flutter-app-structure)
10. [Feature notes](#10-feature-notes)
11. [Testing](#11-testing)
12. [Migration history](#12-migration-history)
13. [What changed from the original app](#13-what-changed-from-the-original-app)
14. [Known gaps](#14-known-gaps)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. What this is

A Flutter app and a Node/Fastify/PostgreSQL API covering fifteen student-facing features: to-do lists, class reminders, CGPA tracking, lab report cover pages, campus transport schedules, a blood-donor network, a textbook exchange with chat, lost & found, notices, notifications, and file uploads.

**The app previously had almost no backend.** Firebase Auth handled email/password sign-in and nothing else; every other feature ran on hardcoded fixtures or `SharedPreferences`. Nothing synced, nothing survived a reinstall, and nothing was shared between users. The backend documented here replaced all of it, and Firebase was removed entirely.

### Stack

| Layer | Choice |
| --- | --- |
| App | Flutter, Dart SDK `^3.11.0` |
| App HTTP | `dio` with a refresh-on-401 interceptor |
| App storage | `flutter_secure_storage` (Keychain / EncryptedSharedPreferences) |
| App state | `provider` + `ChangeNotifier`, plus `setState` for local screens |
| Server | Node 22+ (developed on 24), **plain JavaScript** (ESM) — no TypeScript |
| Framework | Fastify 5 |
| Database | PostgreSQL 17 |
| ORM | Prisma 6 |
| Validation | Zod, on request **and** response |
| Hashing | argon2id |
| Tests | Vitest via `fastify.inject()` |

Because the server is plain JavaScript, **Zod schemas are the type safety**. They validate every request body, param, query, and response at runtime. ESLint is the static gate; there is no compiler.

---

## 2. Architecture

```text
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  Flutter app                │         │  Fastify API                 │
│                             │         │                              │
│  screens/                   │         │  plugins/                    │
│    ↓ calls                  │         │    errors → security → …     │
│  repositories/              │  HTTPS  │    → prisma → auth           │
│    ↓ uses                   │ ──────► │                              │
│  api/ApiClient              │         │  modules/<domain>/           │
│    · attaches access token  │         │    routes.js  (HTTP + Zod)   │
│    · refreshes once on 401  │         │    service.js (logic+owner)  │
│    ↓ reads                  │         │    schema.js  (contracts)    │
│  api/TokenStore (Keychain)  │         │           ↓                  │
└─────────────────────────────┘         │  Prisma → PostgreSQL         │
                                        └──────────────────────────────┘
```

### Request lifecycle

1. A screen calls a repository method.
2. `ApiClient` attaches `Authorization: Bearer <access token>`.
3. Fastify runs `onRequest` hooks: `requireAuth` verifies the JWT, then any `requireRole` guard.
4. Zod validates body/params/query. The **parsed** value is used, so coercions and defaults apply and unknown keys are stripped.
5. The service layer runs the business logic **and the ownership check** — every user-owned query filters by the token's user id.
6. Zod validates the response against an allowlist schema before serialisation.

### The module pattern

Every feature module has the same three files. Adding a feature never requires inventing a new shape:

| File | Responsibility |
| --- | --- |
| `routes.js` | HTTP surface, Zod schemas, auth/role hooks, per-route rate limits |
| `service.js` | Business logic **and every ownership check** |
| `schema.js` | Zod request/response contracts and mapping helpers |

Small modules (`notifications`, `me`, `files`, `health`) collapse into fewer files where three would be ceremony.

### Token refresh, and why it needs a mutex

Access tokens live 15 minutes. When one expires mid-session, `ApiClient` transparently refreshes and replays the original request once.

Refresh is guarded by a **single in-flight future**. Without it, a screen firing several parallel requests would each get a 401 and each try to refresh — and because the server rotates refresh tokens and treats a replay as theft, the second attempt would revoke the whole session family and sign the user out. The mutex is what makes rotation safe on a chatty client.

---

## 3. Repository layout

```text
aust-central/
├── README.md                    Quick start + status
├── DOCUMENTATION.md             This file
├── client/                      Empty placeholder for a future web client
├── mobile/aust-central/         Flutter app (Dart package: aust_track)
└── server/                      Node + Fastify + PostgreSQL API
```

> The repo directory is `aust-central` but the **Dart package is `aust_track`** — all imports are `package:aust_track/...`.

### Server

```text
server/
├── docker-compose.yml           postgres (5434) + postgres-test (5433)
├── eslint.config.js             flat config + eslint-plugin-security
├── vitest.config.js
├── .env.example
├── prisma/
│   ├── schema.prisma            28 models, 14 enums
│   ├── migrations/              3 migrations
│   └── seed.js                  Ports the app's original fixtures
├── src/
│   ├── server.js                Entrypoint, graceful shutdown
│   ├── app.js                   buildApp() — plugin + route assembly
│   ├── config/
│   │   ├── env.js               Zod-validated env, fails fast at boot
│   │   └── logger.js            pino with credential redaction
│   ├── plugins/
│   │   ├── errors.js            Central error boundary
│   │   ├── security.js          helmet, CORS, rate limit, multipart
│   │   ├── prisma.js            Client lifecycle
│   │   └── auth.js              JWT verify, requireAuth, requireRole
│   ├── lib/
│   │   ├── errors.js            AppError taxonomy
│   │   ├── crypto.js            argon2id, opaque tokens, hashing
│   │   ├── ownership.js         findOwned / assertOwned / updateOwned
│   │   ├── pagination.js        Cursor pagination
│   │   ├── validation.js        Zod ↔ Fastify compilers
│   │   ├── file-type.js         Magic-byte sniffing
│   │   └── mailer.js            nodemailer, logs to stdout in dev
│   └── modules/                 auth, me, tasks, class-reminders, cgpa,
│                                lab-reports, notices, blood, lost-found,
│                                books, transport, notifications, files, health
└── test/
    ├── auth.test.js             25 tests
    ├── security.test.js         31 tests
    ├── tasks.test.js             8 tests
    ├── calculations.test.js     10 tests
    └── helpers/                 app.js, auth.js
```

### App

```text
mobile/aust-central/lib/
├── main.dart                    Providers + MaterialApp
├── splash_screen.dart           Splash + auth gate
├── welcome_screen.dart, login_page.dart, register_page.dart
├── api/
│   ├── api_client.dart          dio + refresh interceptor
│   ├── api_config.dart          Base URL (10.0.2.2 on Android emulator)
│   ├── api_exception.dart       Typed errors + field-level messages
│   └── token_store.dart         Secure token storage
├── repositories/
│   ├── academic_repository.dart   tasks, reminders, CGPA, lab reports
│   ├── community_repository.dart  notices, blood, lost&found, books
│   └── platform_repository.dart   dashboard, profile, transport,
│                                  notifications, uploads
├── services/auth_service.dart   ChangeNotifier over the auth endpoints
├── models/                      app_user, blood_request, class_reminder,
│                                course_grade
├── viewmodels/                  cgpa_calculator, class_reminder
├── screens/                     one per feature; book_exchange/ nested
├── widgets/                     async_views (loading/error/empty), cards
└── theme/app_colors.dart        Colour source of truth
```

---

## 4. Getting started

Run the server first — the app cannot sign in without it.

```bash
# 1. API
cd server
npm install
cp .env.example .env               # then fill in the two secrets, below
docker compose up -d postgres postgres-test
npm run db:migrate
npm run db:seed
npm run dev                        # http://localhost:3000

# 2. App
cd ../mobile/aust-central
flutter pub get
flutter run
```

Generate the two required secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`JWT_ACCESS_SECRET` and `PASSWORD_PEPPER` must each be ≥32 characters **and differ from each other**. The server validates its entire environment at boot and refuses to start otherwise — a server running on a default signing key is worse than one that will not start.

### Seeded accounts

Password for all three: `DemoPassword1`

| Account | Role | Notes |
| --- | --- | --- |
| `farhana@aust-central.local` | STUDENT | Has tasks, grades, reminders, donor profile |
| `arman@aust-central.local` | STUDENT | Book seller with listings |
| `admin@aust-central.local` | ADMIN | Can post notices |

The seed also creates 17 bus stops, 3 buses with routes, 15 departures, 4 notices, 2 blood requests, 3 book listings, and 5 lost & found items — ported from the fixtures that used to be hardcoded in the widgets.

### Pointing the app at the server

| Target | Base URL | Notes |
| --- | --- | --- |
| Android emulator | `http://10.0.2.2:3000/api/v1` | **Default.** `localhost` on an emulator is the emulator itself |
| iOS simulator / desktop | `http://localhost:3000/api/v1` | Default |
| Physical device | Your machine's LAN IP | Must be passed explicitly |

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000/api/v1
```

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with file watching |
| `npm start` | Start once |
| `npm run lint` | ESLint — the main static gate |
| `npm test` | Vitest against the test database |
| `npm run db:migrate` | Create + apply a migration from schema changes |
| `npm run db:deploy` | Apply existing migrations (CI / production) |
| `npm run db:reset` | Drop and rebuild the dev database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma's data browser |

---

## 5. Configuration

All environment variables are declared and validated in `src/config/env.js`.

### Required

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Must start with `postgres` |
| `JWT_ACCESS_SECRET` | ≥32 chars |
| `PASSWORD_PEPPER` | ≥32 chars, must differ from the JWT secret |

### Common

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` / `test` / `production` |
| `PORT` | `3000` | |
| `PUBLIC_URL` | `http://localhost:3000` | Used to build email links; **must be https in production** |
| `JWT_ACCESS_TTL` | `15m` | |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |
| `PASSWORD_MIN_LENGTH` | `10` | |
| `ALLOWED_EMAIL_DOMAIN` | *(unset)* | Set to e.g. `aust.edu` to restrict sign-up |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated. **`*` is rejected in production** |
| `RATE_LIMIT_MAX` | `300` per minute | Global |
| `AUTH_RATE_LIMIT_MAX` | `10` per 15 min | Auth routes |
| `STORAGE_DIR` | `./storage` | Local upload root |
| `MAX_UPLOAD_BYTES` | `5242880` (5 MB) | |
| `SMTP_*` | *(unset)* | With no host, mail is logged to stdout instead of sent |

### Production-only invariants

The server refuses to boot in production if: `CORS_ORIGINS` contains `*`, `PASSWORD_PEPPER` equals `JWT_ACCESS_SECRET`, `SMTP_HOST` is unset, or `PUBLIC_URL` is not `https://`.

### Ports

| Service | Host port | Why |
| --- | --- | --- |
| Dev database | **5434** | Avoids colliding with a PostgreSQL already installed on the machine |
| Test database | **5433** | Separate, `tmpfs`-backed, so a test run never truncates dev data |
| API | 3000 | |

Both databases bind to `127.0.0.1` only — without that prefix Docker publishes on `0.0.0.0` and punches through the host firewall.

---

## 6. Data model

28 models and 14 enums. Conventions applied throughout:

- **Primary keys are UUIDs.** Sequential integers would let anyone holding one id enumerate their neighbours' rows.
- **Every user-owned row carries `userId`** and cascades on user delete.
- **Emails are stored pre-lowercased** by the service layer, so `citext` (which needs a superuser install step) is not required.
- **Clock values are `"HH:mm"` strings.** Class times and departures are wall-clock campus times with no date or zone; storing them as `DateTime` invites silent UTC shifts on the client. A CHECK constraint enforces the format.

### Identity

| Model | Purpose |
| --- | --- |
| `User` | email, passwordHash, name, studentId, department, role, emailVerifiedAt, failedLoginCount, lockedUntil, avatarFileId, deletedAt |
| `RefreshToken` | tokenHash, **familyId**, expiresAt, revokedAt, usedAt, ip, userAgent |
| `PasswordResetToken` / `EmailVerificationToken` | tokenHash, expiresAt, usedAt |
| `AuditLog` | actorId, action, entity, entityId, metadata, ip, userAgent |

`Role` is `STUDENT | MODERATOR | ADMIN`.

**Soft delete on `User`:** content authored by a removed account (notices, messages) must survive, so rows are retained and filtered rather than dropped.

### Academic

| Model | Notes |
| --- | --- |
| `Task` | title, note, category (`TODAY`/`LATER`), dueDate, isDone |
| `ClassReminder` | courseName, weekday, classTime, isEnabled, minutesBefore |
| `AssessmentReminder` | type (`QUIZ`/`MID`/`LAB`), dateTime |
| `Semester` | name, position — explicit, because semester names don't sort chronologically |
| `CourseGrade` | courseName, `credits Decimal(4,2)`, grade |
| `LabReportDraft` | the ten cover-page fields |

`Grade` is `A_PLUS, A, A_MINUS, B_PLUS, B, B_MINUS, C, D, F`.

**Credits are `Decimal`, not float** — 1.5-credit labs exist, and GPA divides by the credit total, so drift is unacceptable. **GPA and CGPA are never stored**; persisting a computed average is how it goes stale after an edit.

### Community

| Model | Notes |
| --- | --- |
| `Notice` | title, body, category, pinned, postedAt, authorId (SetNull), deletedAt |
| `DonorProfile` | userId is the PK — one per user |
| `BloodRequest` | patientName, bloodGroup, hospital, units, urgency, requiredBy, contactNumber, status |
| `BookListing` | title, courseCode, department, semester, condition, listingType, priceBdt, status |
| `BookImage`, `Bookmark` | Bookmark PK is `(userId, listingId)` — a double-save is impossible without a read |
| `Conversation` | listingId, buyerId, sellerId, lastMessageAt; **unique `(listingId, buyerId)`** |
| `Message` | conversationId, senderId, body, readAt |
| `SellerReview` | rating 1–5, comment; **unique `(raterId, listingId)`** |
| `LostFoundItem`, `LostFoundImage` | name, kind, category, colour, room, occurredOn, status |

`lastMessageAt` on `Conversation` is denormalised so the inbox sorts without touching the messages table.

### Transport

`BusStop`, `Bus`, `RouteStop` (busId, stopId, **position**), `Departure` (departureTime, `daysOfWeek Weekday[]`).

Reference data, read-only to students. **There is no ticket model** — see [§10](#transport).

### Platform

| Model | Notes |
| --- | --- |
| `FileObject` | ownerId, storageKey, originalName, **mime detected from bytes**, sizeBytes, sha256 |
| `Notification` | type, title, body, `payload Json`, readAt |

### Database-level constraints

Rules that must not depend on application code live in migration `20260815110900_add_check_constraints`, because app validation is one bug — or one direct `psql` session — away from being bypassed:

- `book_listings`: SALE requires a price; SWAP/FREE must have none
- `seller_reviews`: rating between 1 and 5; `raterId <> sellerId`
- `blood_requests`: units between 1 and 20
- `conversations`: `buyerId <> sellerId`
- `class_reminders`: minutesBefore 0–1440; `classTime ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`
- `departures`: same time-format regex
- `course_grades`: credits > 0 and ≤ 30
- `file_objects`: sizeBytes > 0

---

## 7. API reference

Base path `/api/v1`. JSON only. All list endpoints use cursor pagination (`?cursor=&limit=`, max 100).

Probes sit at the root, unauthenticated and rate-limit exempt: `GET /health` (liveness), `GET /ready` (checks the database).

### Auth — `/auth`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/register` | Returns a session; sends a verification email |
| POST | `/login` | Rate limited; locks after 5 failures |
| POST | `/refresh` | Rotates the token; detects reuse |
| POST | `/logout` | Revokes the token family |
| POST | `/forgot-password` | Enumeration-safe |
| POST | `/reset-password` | Single-use token; revokes all sessions |
| POST | `/verify-email` | |
| POST | `/resend-verification` | |
| GET | `/me` | Re-checks the user against the database |
| PATCH | `/password` | Revokes all sessions on success |

Mobile clients read `refreshToken` from the JSON body and store it in the OS keychain; browsers use the `httpOnly` cookie and ignore the body copy.

### Me — `/me`

`GET /` · `PATCH /` · `PUT /avatar` · `GET /dashboard`

`GET /dashboard` returns every counter the home screen shows in one round trip: `greetingName`, `tasksDueToday`, `nextClass`, `cgpa`, `labReportDrafts`, `openBloodRequests`, `activeListings`, `openLostFoundItems`, `unreadNotifications`, `latestNotice`.

`PATCH /` deliberately cannot change `role`, `email`, or `emailVerifiedAt` — an email change must re-verify, and role changes are an admin action.

### Feature endpoints

| Area | Endpoints |
| --- | --- |
| **Tasks** `/tasks` | `GET /` `GET /:id` `POST /` `PATCH /:id` `DELETE /:id` — `?filter=all\|today\|later\|completed`, `?search=` |
| **Class reminders** `/class-reminders` | `GET /` `GET /next` `GET /:id` `POST /` `PATCH /:id` `DELETE /:id` `POST /:id/assessments` `DELETE /:id/assessments/:assessmentId` |
| **CGPA** `/cgpa` | `GET /summary` `POST /what-if` `GET /semesters` `POST /semesters` `PATCH /semesters/:id` `DELETE /semesters/:id` `POST /semesters/:id/courses` `PATCH /semesters/:id/courses/:courseId` `DELETE /semesters/:id/courses/:courseId` |
| **Lab reports** `/lab-reports` | `GET /` `GET /:id` `POST /` `PATCH /:id` `DELETE /:id` |
| **Notices** `/notices` | `GET /` `GET /latest` `GET /:id` — all signed-in users<br>`POST /` `PATCH /:id` `DELETE /:id` — **MODERATOR/ADMIN only** |
| **Blood** `/blood` | `GET /donor-profile` `PUT /donor-profile` `GET /requests` `POST /requests` `PATCH /requests/:id` |
| **Lost & found** `/lost-found` | `GET /` `GET /categories` `GET /:id` `POST /` `PATCH /:id` `DELETE /:id` — `?search=&category=&kind=&status=&mine=` |
| **Books** `/books` | `GET/POST /listings` `GET/PATCH/DELETE /listings/:id` `PUT/DELETE /listings/:id/bookmark` `GET/POST /conversations` `GET/POST /conversations/:id/messages` `POST /conversations/:id/read` `GET/POST /sellers/:id/reviews` |
| **Transport** `/transport` | `GET /stops` `GET /buses` `GET /departures?from=&to=&date=` — **read-only** |
| **Notifications** `/notifications` | `GET /` `GET /unread-count` `POST /:id/read` `POST /read-all` |
| **Files** `/files` | `POST /` (multipart) `GET /:id` (authorised stream) `DELETE /:id` |

### Error envelope

Every failure has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": { "fields": { "password": ["Password must be at least 10 characters"] } }
  },
  "requestId": "0789cd42-cb8d-488a-b800-b8a04e2d64cb"
}
```

`requestId` appears on every log line for that request, so a user-reported failure can be found without guesswork.

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | |
| 401 | `UNAUTHORIZED` | Missing/invalid token, or bad credentials |
| 403 | `FORBIDDEN` | Authenticated but lacking the role |
| 404 | `NOT_FOUND` | **Also returned for resources you don't own** |
| 409 | `CONFLICT` | Duplicate email, existing conversation |
| 413 | `PAYLOAD_TOO_LARGE` | |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Upload failed magic-byte validation |
| 422 | `VALIDATION_FAILED` | With per-field messages |
| 429 | `TOO_MANY_REQUESTS` | |
| 500 | `INTERNAL_ERROR` | Opaque in production |

---

## 8. Security design

The parts that are easy to regress, and why they are the way they are.

### Passwords

argon2id at 64 MiB / t=3 / p=1, plus a **server-side pepper** from the environment. The pepper never touches the database, so a stolen dump alone cannot mount an offline attack. Hashes are transparently upgraded on next login when the cost parameters are raised.

Policy: ≥10 characters (configurable), mixed case, at least one digit, capped at 72 bytes — a real constraint of the hashing family, beyond which some implementations silently truncate.

### Sessions

- **Access tokens**: 15-minute JWTs, HS256 with the **algorithm pinned** — this blocks `alg: none` and RS/HS confusion attacks, where a token declares its own weaker verification scheme.
- **Refresh tokens**: 30-day opaque 256-bit values, stored **only as SHA-256**. A database dump cannot be replayed as a session.
- **Rotation with reuse detection**: every refresh mints a new token and marks the old one used. Presenting a spent token means it leaked, so the **entire token family is revoked** and the event is audit-logged. Losing a session is a cheap price for containing theft.

Access tokens are *not* checked against the database per request — that is what keeps reads cheap. The trade-off is that a token stays valid until it expires, so the TTL is short and anything that must take effect immediately (ban, password change) revokes the refresh family instead.

### Account enumeration

- Login returns **one identical response** for "wrong password" and "no such account", and pays the cost of a real argon2 hash either way so timing doesn't give it away.
- `/forgot-password` answers identically for known and unknown addresses. Mail failures are **swallowed rather than surfaced as 500s** — that difference would itself be a signal.
- Registration is the deliberate exception: it must tell you the address is taken. Rate limiting is what stops it becoming a bulk oracle.

### Lockout

Five failed attempts locks an account for 15 minutes. Held **on the user row**, not just in the rate limiter, so rotating source IPs does not reset it.

### Authorisation

- RBAC via a `requireRole` decorator.
- **Ownership checks live in the service layer**, not the routes. Every user-owned query filters by the token's user id; no endpoint trusts a path id alone.
- **Ownership failures return 404, not 403.** A 403 would confirm the row exists — exactly the fact an attacker is probing for. `lib/ownership.js` centralises this so no module re-implements it.

### Input and output

Zod on body, params, query **and responses**. The response schema is an allowlist: anything not named in it is stripped before serialisation, which is what structurally prevents `passwordHash`, `tokenHash`, and internal columns from reaching a client even if a service hands back a whole Prisma row.

`.strict()` on create bodies drops unknown keys, so a client cannot smuggle `role: "ADMIN"` into a create call via mass assignment.

### Uploads

Local disk, and the riskiest surface here:

- Size capped per file and per request, enforced **while streaming** so an oversized upload is cut off rather than buffered into memory.
- **Type determined from magic bytes**, never from the declared MIME or the extension. A polyglot named `avatar.png` that is really an HTML document becomes stored XSS the moment a browser renders it.
- Allowlist is JPEG, PNG, GIF, WebP. **SVG is deliberately excluded** — it is XML, it can carry script, and it is a standing XSS vector.
- Filenames are server-generated UUIDs under a month-sharded directory; the client's filename is stored as metadata only and never used to build a path. Files are written `0o640` — never world-readable, never executable.
- Served only through `GET /files/:id` after an auth + visibility check, with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, a `default-src 'none'; sandbox` CSP, and `Cache-Control: private`.
- SHA-256 recorded for dedupe and integrity.

### Transport and headers

helmet with a `default-src 'none'` CSP, HSTS in production only, CORS restricted to an explicit allowlist (never `*` — `credentials: true` with a reflected origin would let any site drive authenticated requests), refresh cookie `httpOnly` + `sameSite=strict` + path-scoped to `/api/v1/auth`.

### Operational

- Environment validated by Zod at boot; the process exits on a bad or missing secret.
- pino redaction of `authorization`, `cookie`, `set-cookie`, and every `password`/`token`/`hash` field.
- Request ids on every log line; errors logged in full and returned opaquely — only deliberate `AppError`s describe themselves to the client, so Prisma and driver messages cannot leak.
- Audit log on auth and moderation actions.
- Graceful shutdown with a 10-second hard ceiling, so a stalled drain cannot hang a deploy.

---

## 9. Flutter app structure

### Startup

```text
main() → build TokenStore + ApiClient + AuthService → runApp
       → SplashScreen: restoreSession() ∥ 1.2s minimum dwell
       → signed in?  HomePage  :  WelcomeScreen
```

`SplashScreen` was a bare 3-second timer that always pushed the welcome screen, so a signed-in user had to log in again on every cold start. It now restores the stored session while the logo is on screen.

### Layers

| Layer | Responsibility |
| --- | --- |
| `api/` | Transport. Token storage, refresh, typed errors |
| `repositories/` | One method per endpoint, grouped by domain |
| `services/auth_service.dart` | Session state as a `ChangeNotifier` |
| `viewmodels/` | CGPA and class reminders (multi-screen state) |
| `screens/` | UI; owns its own loading/error state |
| `widgets/async_views.dart` | Shared `LoadingView` / `ErrorView` / `EmptyView` / `AsyncContent` |

Repositories return plain maps rather than re-deriving a Dart model per endpoint: the server response shapes are already the contract, and duplicating them is where drift creeps in. Screens that already had a model (`Task`, `ClassReminderModel`) map at their own edge.

### Screen conventions

Every migrated screen follows the pattern set by `todo_list_screen.dart`:

1. Build the repository in `initState` from `context.read<ApiClient>()`.
2. `_load()` sets loading, catches `ApiException`, stores `_error`.
3. Render via `AsyncContent` or an explicit loading/error/empty ladder.
4. **Writes are optimistic with rollback** — flip the UI immediately, revert and surface a snackbar if the server rejects it.
5. Pull-to-refresh re-runs `_load()`.

---

## 10. Feature notes

### Dashboard

Every chip is computed. Previously each was a literal string in the widget tree (`'3 due today'`, `'Current: 3.72'`, `'14 listings'`, `'2 requests nearby'`). Chips **hide entirely** while loading or on failure rather than showing a placeholder — an empty pill reads as "zero", which is a different claim from "not loaded".

CGPA is reported as `null` (rendered "No grades yet") rather than `0.00` for a student with no grades. "You have a 0.00 CGPA" would be alarming and wrong.

### CGPA

The grade scale is copied from the app's original `CourseGradeModel.gradePoint` so client and server can never disagree: A+ 4.00, A 3.75, A− 3.50, B+ 3.25, B 3.00, B− 2.75, C 2.50, D 2.00, F 0.00.

GPA is a **credit-weighted mean** — a 3-credit A+ and a 1-credit F average to 3.00, not 2.00. `GET /cgpa/summary` returns a running cumulative CGPA per semester.

`POST /cgpa/what-if` projects hypothetical courses against the real transcript without persisting them.

### Blood bank

The 90-day donation interval moved from the client to the server and is now authoritative. A medical-adjacent rule should not be able to drift between screens, let alone between app versions still installed on phones. Boundary behaviour is pinned by tests: not eligible at day 89, eligible exactly at day 90, never negative days remaining.

**Requests are community-visible** — contact numbers are exposed to any signed-in user. That is the intended trade-off (a request only helps if strangers can see it) and is why the endpoint requires a session and is not public. Only the requester can change a request's status; closing someone else's would be a trivial way to hide an urgent appeal.

### Book exchange

Browse / My Listings / Saved and all four sort orders run server-side. Conversations are keyed `(listingId, buyerId)` so reopening a chat never forks a new thread, and a third party holding a conversation id gets 404 on both read and write.

Seller ratings are real averages over `SellerReview`, shown as "No reviews yet" when there are none rather than the hardcoded `4.9` every seller used to display.

Posting a listing uploads images **first**, then creates the listing — the reverse order can leave a listing referencing files that never arrived.

### Transport

**Informational only. There is no ticketing.** Campus buses are not booked or seat-reserved, so the feature answers "which bus serves my route, when does it leave, and who do I call". A `Ticket` model existed briefly and was removed in migration `drop_transport_tickets` rather than left as dead schema.

Departure search is **direction-aware**: the server only returns buses whose route reaches the origin *before* the destination, so the reverse direction correctly returns nothing even though the bus visits both stops.

### Lost & found

Search and category filtering moved from an in-memory filter over five hardcoded items to server-side queries across every item on campus. Filter chips are built from categories actually in use, so a new one appears as soon as someone reports it.

### Notices

The one asymmetric module: all signed-in users read, only `MODERATOR`/`ADMIN` write. A student attempting to post gets **403, not 404** — the route exists and they are authenticated, so this is a genuine permission failure and hiding it would only confuse. Deletes are soft.

---

## 11. Testing

```bash
cd server && npm run lint && npm test    # 74 tests
cd mobile/aust-central && flutter analyze
```

Tests run against a **real PostgreSQL** in Docker (port 5433), with migrations applied before the first file and every table truncated between cases. The truncate list is derived from the live catalogue, not hardcoded, so a new model cannot silently start leaking rows across tests.

Tests drive the real Fastify instance through `inject()` rather than a mock, so plugins, hooks, validation, and the error handler are all exercised — the security behaviour lives in those layers, not the handlers.

### Coverage

| File | Tests | Focus |
| --- | --- | --- |
| `auth.test.js` | 25 | Registration, login, rotation, reuse detection, lockout, enumeration resistance, password change |
| `security.test.js` | 31 | Cross-module authorisation boundaries |
| `tasks.test.js` | 8 | CRUD + the ownership pattern all modules share |
| `calculations.test.js` | 10 | GPA maths and blood eligibility boundaries (no DB) |

### Security regressions pinned as first-class tests

- Refresh replay revokes the whole family and audit-logs it
- "Wrong password" and "unknown account" return identical status **and message**
- `/forgot-password` responses are byte-identical for known and unknown emails
- `passwordHash` and `$argon2` never appear in any response body
- Cross-user read/update/delete returns 404, and the row is genuinely untouched
- A student cannot post a notice, and cannot escalate via `role` in the body
- Registration drops `role: "ADMIN"` (mass assignment)
- A shell script renamed `innocent.png` is rejected on magic bytes
- An SVG is rejected outright
- A third party cannot read or post to a conversation
- Another user's file id cannot be pinned as your avatar

### Not covered

- **No CI.** `.github/` does not exist; lint, tests, and `npm audit` should gate PRs.
- **No Flutter tests.** `test/widget_test.dart` is still the stock counter template and fails — pre-existing, not a regression.
- **The app has not been run on a device or emulator.** Analyze and build pass, and every endpoint is verified live over HTTP, but the UI has not been exercised on a screen.

---

## 12. Migration history

| Migration | Contents |
| --- | --- |
| `20260815110801_init` | All 28 models, enums, indexes |
| `20260815110900_add_check_constraints` | Hand-written CHECK constraints Prisma cannot express |
| `20260815120606_drop_transport_tickets` | Removed `Ticket` and `TicketStatus` |

---

## 13. What changed from the original app

### Removed

- **Firebase entirely** — `firebase_core`, `firebase_auth`, the Gradle plugin, the BOM, `firebase-analytics`, and `google-services.json`. It provided only email/password auth, and because `Firebase.initializeApp()` was called with no Dart options, the app depended on native config that **only Android had** — iOS, web, and desktop crashed at launch. With Firebase gone, every platform boots.
- **The plaintext password store.** Login wrote the raw password to `SharedPreferences` under `saved_password`, in a file readable by any process running as the same user on a rooted device. The app now stores only tokens, in the Keychain, and **actively deletes the old key on launch** for anyone upgrading. Tokens can be revoked server-side; a password cannot.
- `blood_request_service.dart` — its `SharedPreferences` store is now dead weight.
- Unused dependencies: `google_nav_bar`, `google_fonts`, `dropdown_search`.

### Fixed

- **`INTERNET` permission added to the main manifest.** It was declared only in the debug and profile manifests, so a release APK would have installed with **no network access** and every call would have failed silently.
- **Session persistence** — a valid session now skips the login screen.
- **App label** unified to `AUST Central`.
- **Network security config** added: cleartext HTTP permitted only for loopback dev addresses (`10.0.2.2`, `127.0.0.1`, `localhost`), denied everywhere else. Android blocks cleartext by default since API 28, so without this the app could not reach the dev server at all — and with a blanket `cleartextTrafficPermitted="true"` a production misconfiguration would silently ship tokens in the clear.
- Book post form was **pre-filled with sample content** a distracted user could publish verbatim; fields now start empty. It was also **missing department, semester, and any price input** despite offering a "Fixed Price" option.

### Behaviour that genuinely changed

| Before | After |
| --- | --- |
| Blood requests saved to the device only — no donor could ever see them | Community-visible |
| Same three buses shown for every journey | Only buses actually serving that route, in that direction |
| Every seller rated `4.9` | Real averages, or honestly absent |
| Chat was two sample messages, identical for every seller, lost on pop | Real persisted conversation between the two participants |
| To-do list lost everything on screen pop | Persisted per user |
| Class reminder toggles changed nothing | Persisted |
| Lost & found searched five hardcoded items | Searches every item on campus |

---

## 14. Known gaps

### Release blockers

Both need a decision, not a code change:

- **`applicationId` is `com.example.aust_track`.** Play rejects `com.example.*`. A real package name (e.g. `edu.aust.central`) must be applied to the Gradle namespace, the Kotlin source path, and `MainActivity.kt`.
- **Release builds sign with the debug keystore.** A real upload key must be generated and referenced from a `signingConfig`, with credentials kept out of the repo.

### Operational

- **Local disk uploads** don't survive container replacement and won't scale past one host. The `FileObject` indirection means swapping in S3/R2 later touches one module.
- **Production needs TLS** terminated at a proxy, with `PUBLIC_URL` set to `https://` — env validation refuses to boot otherwise.
- **No CI.**
- **Existing Firebase accounts** cannot be migrated: password hashes cannot be exported from Firebase, so a forced reset is the realistic path.

### Technical debt

- Two `app_colors.dart` files exist (`theme/` and `constants/`). `theme/` is the one wired into `main.dart`.
- Several pre-login screens still hardcode `Color(0xff407362)`, a different green from `AppColors.darkGreen`.
- `flutter analyze` reports ~20 info-level lints, mostly deprecated `withOpacity` and `activeColor` in pre-existing widget code.
- `placeholder_screen.dart` is now unused.
- **No TypeScript** means Prisma↔Zod schema drift is only caught at runtime, which is why response-schema tests matter more than usual here.

---

## 15. Troubleshooting

**`P1000: Authentication failed against database server`**
Something else is on the port. If you have PostgreSQL installed locally it owns 5432, and Prisma will connect to *it* rather than the container. Ours is on **5434** — check `DATABASE_URL`.

**All endpoints 404 but `/auth/login` works**
A stale server process is holding port 3000 and serving older code. `pkill` does not work on Windows:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**`Invalid environment configuration` on boot**
Working as designed. The message lists exactly which variables are missing or too short. `.env` is loaded via Node's built-in `process.loadEnvFile`; variables already in the environment win.

**`EPERM: operation not permitted, rename … query_engine-windows.dll.node`**
`prisma generate` cannot replace the engine while a node process holds it. Stop the dev server and any test run, then re-run.

**App can't reach the server from an emulator**
Use `10.0.2.2`, not `localhost` — on an emulator `localhost` is the emulated device itself. This is already the default.

**`flutter test` fails**
Pre-existing. `test/widget_test.dart` is the stock counter template asserting on widgets that don't exist. Use `flutter analyze` as the gate.

**Migrating the test database fails**
`docker compose up -d postgres-test`. The suite applies migrations itself before the first test file.

---

## Appendix: verification snapshot

```text
flutter analyze          0 errors, 22 info/warnings (2 pre-existing)
flutter build apk        Built app-debug.apk, exit 0
npm run lint             exit 0
npm test                 74 passed (4 files)
Live API smoke           14/14 endpoints → 200
/transport/tickets       404 (correctly removed)
```
