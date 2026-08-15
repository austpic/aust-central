# AUST Central

A campus companion app for students of Ahsanullah University of Science and Technology (AUST) — class reminders, CGPA tracking, campus transport, a blood-donor network, a textbook exchange, lost & found, and notices.

Three parts sharing one backend: a **Flutter app**, a **React web client**, and the **Node/Fastify/PostgreSQL API** that owns all the data.

> **Status: beta.** Every feature on both clients is wired end to end — each reads and writes real data through the same API, and no screen on either client renders hardcoded fixtures. CI runs lint, tests, and a security audit on all three parts. Remaining work is release engineering, not features: see [§16 Known gaps](#16-known-gaps).

**Last verified:** 15 August 2026 · `flutter analyze` 0 errors · `flutter test` 14 passed · `npm run lint` clean (server + web) · **79 server tests** · **10 web tests** · `tsc -b` clean · web production build succeeds · CI green on all three jobs

---

## Table of contents

1. [What this is](#1-what-this-is)
2. [Getting started](#2-getting-started)
3. [Repository layout](#3-repository-layout)
4. [Architecture](#4-architecture)
5. [Migration status](#5-migration-status)
6. [Configuration](#6-configuration)
7. [Data model](#7-data-model)
8. [API reference](#8-api-reference)
9. [Security design](#9-security-design)
10. [Flutter app structure](#10-flutter-app-structure)
11. [Web client structure](#11-web-client-structure)
12. [Feature notes](#12-feature-notes)
13. [Testing](#13-testing)
14. [Migration history](#14-migration-history)
15. [What changed from the original app](#15-what-changed-from-the-original-app)
16. [Known gaps](#16-known-gaps)
17. [Troubleshooting](#17-troubleshooting)
18. [Appendix: verification snapshot](#18-appendix-verification-snapshot)

---

## 1. What this is

A Flutter app, a React web client, and a Node/Fastify/PostgreSQL API covering fifteen student-facing features: to-do lists, class reminders, CGPA tracking, lab report cover pages, campus transport schedules, a blood-donor network, a textbook exchange with chat, lost & found, notices, notifications, and file uploads.

**Neither client originally had a real backend.** The Flutter app used Firebase Auth for email/password sign-in and nothing else; every other feature ran on hardcoded fixtures or `SharedPreferences`. The web client was a static React mockup — 29 screens with realistic UI but a `localStorage` boolean for "logged in" and ten files of fake seed data under `src/data/`. Nothing synced, nothing survived a reinstall or a reload, and nothing was shared between users on either client. The backend documented here replaced all of it: Firebase was removed from the app, the web client's fixtures were deleted, and both clients now read and write the same real data through the same API.

### Stack

| Layer | Choice |
| --- | --- |
| App | Flutter, Dart SDK `^3.11.0` |
| App HTTP | `dio` with a refresh-on-401 interceptor |
| App storage | `flutter_secure_storage` (Keychain / EncryptedSharedPreferences) |
| App state | `provider` + `ChangeNotifier` (`BaseViewModel`), plus local `setState` for pure view state |
| Web | React 19, TypeScript, Vite, React Router 7 |
| Web HTTP | `fetch`, wrapped in `src/api/client.ts` with the same refresh-on-401 behavior as `dio` |
| Web session | Refresh token in an `httpOnly` cookie; access token in a module-level variable |
| Web styling | Tailwind CSS v4 (`@theme` tokens), matching the app's palette |
| Server | Node 22+ (developed on 24), **plain JavaScript** (ESM) — no TypeScript |
| Framework | Fastify 5 |
| Database | PostgreSQL 17 |
| ORM | Prisma 6 |
| Validation | Zod, on request **and** response |
| Hashing | argon2id |
| Server tests | Vitest via `fastify.inject()` |
| Web tests | Vitest + Testing Library |
| App tests | `flutter_test`, fake repositories (no widget tree) + widget smoke tests |
| CI | GitHub Actions, three independent jobs — see [§13](#13-testing) |

Because the server is plain JavaScript, **Zod schemas are the type safety**. They validate every request body, param, query, and response at runtime. ESLint is the static gate on the server; TypeScript's compiler (`tsc -b`) is the gate on the web client.

---

## 2. Getting started

Run the server first — neither client can sign in without it.

```bash
# 1. API
cd server
npm install
cp .env.example .env               # then fill in the two secrets, below
docker compose up -d postgres postgres-test
npm run db:migrate
npm run db:seed
npm run dev                        # http://localhost:3000

# 2a. App
cd ../mobile/aust-central
flutter pub get
flutter run

# 2b. Web (separate terminal)
cd ../../client
npm install
npm run dev                        # http://localhost:5173
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
| `farhana@aust.edu` | STUDENT | Has tasks, grades, reminders, donor profile |
| `arman@aust.edu` | STUDENT | Book seller with listings |
| `admin@aust.edu` | ADMIN | Can post notices |

The seed also creates 17 bus stops, 3 buses with routes, 15 departures, 4 notices, 2 blood requests, 3 book listings, and 5 lost & found items — ported from the fixtures that used to be hardcoded in both clients' widgets/components.

Registration (and every other email-taking endpoint) is restricted to `@aust.edu` addresses — see `ALLOWED_EMAIL_DOMAIN` in [§6 Configuration](#6-configuration).

### Pointing each client at the server

| Client | Base URL | Notes |
| --- | --- | --- |
| Android emulator | `http://10.0.2.2:3000/api/v1` | **Default.** `localhost` on an emulator is the emulator itself |
| iOS simulator / desktop | `http://localhost:3000/api/v1` | Default |
| Physical device | Your machine's LAN IP | Must be passed explicitly |
| Web dev server | `http://localhost:3000/api/v1` | **Default**, from `client/src/api/config.ts` |

```bash
# App, physical device
flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000/api/v1

# Web, non-default server
cd client && cp .env.example .env && echo 'VITE_API_BASE_URL=http://192.168.0.10:3000/api/v1' >> .env
```

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the server with file watching |
| `npm start` | Start the server once |
| `npm run lint` | ESLint (server) / oxlint (web) — the main static gate |
| `npm test` | Vitest — server against the test database, web with mocks |
| `npm run db:migrate` | Create + apply a migration from schema changes |
| `npm run db:deploy` | Apply existing migrations (CI / production) |
| `npm run db:reset` | Drop and rebuild the dev database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma's data browser |
| `npm run build` (client) | `tsc -b` then a production Vite build |

---

## 3. Repository layout

```text
aust-central/
├── README.md                    Everything — this file
├── .github/workflows/ci.yml     server / app / web jobs
├── client/                      React web client (Vite, TypeScript)
├── mobile/aust-central/         Flutter app (Dart package: aust_track)
└── server/                      Node + Fastify + PostgreSQL API
```

> The repo directory is `aust-central` but the **Dart package is `aust_track`** — all imports are `package:aust_track/...`.

Both clients follow the same layering — `api/` (transport), `repositories/` (one method per endpoint), `viewmodels/` (state), `views`/`screens` (UI, owns no state of its own) — so a feature added to one is a straightforward port to the other. See [§10](#10-flutter-app-structure) and [§11](#11-web-client-structure) for the full breakdown of each.

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
│   └── seed.js                  Ports both clients' original fixtures
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
│   │   ├── validation.js        Zod ↔ Fastify compilers, booleanQuery()
│   │   ├── file-type.js         Magic-byte sniffing
│   │   └── mailer.js            nodemailer, logs to stdout in dev
│   └── modules/                 auth, me, tasks, class-reminders, cgpa,
│                                lab-reports, notices, blood, lost-found,
│                                books, transport, notifications, files, health
└── test/
    ├── auth.test.js             25 tests
    ├── security.test.js         36 tests
    ├── tasks.test.js             8 tests
    ├── calculations.test.js     10 tests
    └── helpers/                 app.js, auth.js
```

### App

```text
mobile/aust-central/lib/
├── main.dart                    Providers (ApiClient, 3 repositories, AuthService) + MaterialApp
├── core/
│   └── base_view_model.dart     ViewState, runLoad/runAction, safeNotify — every VM extends this
├── data/
│   ├── api/                     api_client.dart, api_exception.dart, token_store.dart
│   ├── models/                  app_user, task, class_reminder_model, course_grade_model,
│   │                            blood_request, donor_profile, notice, chat_message,
│   │                            app_notification
│   ├── repositories/            academic_repository.dart   tasks, reminders, CGPA, lab reports
│   │                            community_repository.dart  notices, blood, lost&found, books, chat
│   │                            platform_repository.dart   dashboard, profile, transport,
│   │                                                       notifications, uploads
│   └── services/                auth_service.dart — session ChangeNotifier
├── theme/
│   └── app_colors.dart          AppColors + CgpaColors — the one colour source of truth
├── utils/
│   └── blood_helpers.dart       Date-picker clamp + display formatting only —
│                                eligibility itself is server-computed
├── viewmodels/                  15 files, 16 view model classes (transport_view_model.dart
│                                holds two: BusStopsViewModel + BusSelectionViewModel), all
│                                constructor-injected with their repository. 14 extend
│                                BaseViewModel; CGPACalculatorViewModel and
│                                ClassReminderViewModel extend ChangeNotifier directly and
│                                manage their own loading/error state — see §10
└── views/
    ├── auth/                    splash, welcome, login, register
    ├── home/                    dashboard
    ├── tasks/                   to-do list
    ├── class_reminder/
    ├── cgpa/                    calculator, history, what-if
    ├── lab_report/
    ├── notices/
    ├── blood/                   bank, request form
    ├── lost_found/
    ├── book_exchange/           browse, listing detail, post, seller profile, chat —
    │                            wired; own profile + notifications — still hardcoded
    │                            stubs, see §16
    ├── transport/                stops, schedule, bus selection, receipt
    ├── notifications/           the real inbox — NotificationsViewModel + PlatformRepository
    ├── profile/
    └── widgets/                  async_views.dart (LoadingView/ErrorView/EmptyView/AsyncContent),
                                   avatars.dart (InitialsAvatar, BookCoverPlaceholder),
                                   blood_request_card.dart, cgpa_widgets.dart, custom_cards.dart,
                                   my_status_card.dart, notice_card.dart, transportation_card.dart
```

View models never import from `views/` — the dependency direction is strictly view → view model → repository, which is what makes a view model testable without a widget tree (see [§13](#13-testing)).

### Web

```text
client/src/
├── api/            client.ts (fetch wrapper), config.ts, errors.ts
├── repositories/   academic.ts · community.ts · platform.ts — one method per endpoint
├── viewmodels/     30 hooks (useXViewModel) + AuthContext, CgpaContext, BloodBankContext
├── models/         TypeScript interfaces + display mappers
├── views/          29 route components — presentational, one useXViewModel() each
└── components/     30 shared UI pieces
```

See [§11](#11-web-client-structure) for how this maps onto the Flutter layers above.

---

## 4. Architecture

```text
┌─────────────────────────────┐
│  Flutter app                │
│                             │         ┌──────────────────────────────┐
│  views/                    │         │  Fastify API                 │
│    ↓ calls                  │         │                              │
│  viewmodels/                │         │  plugins/                    │
│    ↓ uses                   │         │    errors → security → …     │
│  data/repositories/         │  HTTPS  │    → prisma → auth           │
│    ↓ uses                   │ ──────► │                              │
│  data/api/ApiClient         │         │  modules/<domain>/           │
│    · Authorization header   │         │    routes.js  (HTTP + Zod)   │
│    · refreshes once on 401  │         │    service.js (logic+owner)  │
│    ↓ reads                  │         │    schema.js  (contracts)    │
│  data/api/TokenStore        │         │           ↓                  │
│   (Keychain, both tokens)   │         │  Prisma → PostgreSQL         │
└─────────────────────────────┘         │                              │
                                        │           ▲                  │
┌─────────────────────────────┐        │           │ HTTPS            │
│  React web client            │        │  refresh via httpOnly cookie │
│                             │         │  everything else via         │
│  views/                     │         │  Authorization header        │
│    ↓ calls                  │ ──────► │                              │
│  viewmodels/ (useXViewModel)│         └──────────────────────────────┘
│    ↓ uses                   │
│  repositories/               │
│    ↓ uses                   │
│  api/client.ts               │
│    · Authorization header   │
│    · refreshes once on 401  │
│    ↓ reads/writes            │
│  module-level accessToken    │
│  + httpOnly refresh cookie   │
│   (browser-managed)          │
└─────────────────────────────┘
```

### Request lifecycle

1. A view calls a repository method.
2. The API client attaches `Authorization: Bearer <access token>` — from `TokenStore` on mobile, from the module-level variable on web. The web client also sends `credentials: 'include'` on every call so the refresh cookie rides along automatically.
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

Access tokens live 15 minutes. When one expires mid-session, both clients transparently refresh and replay the original request once.

Refresh is guarded by a **single in-flight future/promise** on each client. Without it, a screen firing several parallel requests would each get a 401 and each try to refresh — and because the server rotates refresh tokens and treats a replay as theft, the second attempt would revoke the whole session family and sign the user out. The mutex is what makes rotation safe on a chatty client. `mobile/aust-central/lib/data/api/api_client.dart` and `client/src/api/client.ts` implement the identical pattern: `refreshInFlight ??= performRefresh().finally(() => refreshInFlight = null)`.

### Why the two clients keep different session storage

Mobile has an OS keychain; a browser tab does not have an equivalent that is both persistent and inaccessible to JavaScript. So:

- **Mobile** stores both the access and refresh token in `flutter_secure_storage` (Keychain / EncryptedSharedPreferences) via `TokenStore`.
- **Web** never stores the refresh token in JavaScript-reachable storage at all. The server sets it as an `httpOnly`, `sameSite=strict` cookie scoped to `/api/v1/auth`, so a browser attaches it automatically on the one endpoint that needs it and no script — including an XSS payload — can read it. The access token lives in a plain module-level variable, which is deliberately *not* durable: a page reload always costs one `/auth/refresh` round trip, in exchange for the access token never touching `localStorage`/`sessionStorage`, where an XSS bug could exfiltrate it in one line.

Both are documented in each client's own file: [`ApiClient`](mobile/aust-central/lib/data/api/api_client.dart) and [`api/client.ts`](client/src/api/client.ts).

**Firebase has been removed entirely.** It previously provided only email/password auth, and because `Firebase.initializeApp()` was called with no Dart options, the app depended on native config that only Android had — so iOS, web, and desktop crashed on launch. With Firebase gone, every platform boots.

---

## 5. Migration status

| Feature | API | App | Web |
| --- | --- | --- | --- |
| Auth (register/login/refresh/reset) | ✅ | ✅ | ✅ |
| Session persistence across restarts | ✅ | ✅ | ✅ |
| Dashboard counters | ✅ | ✅ | ✅ |
| To-do list | ✅ | ✅ | ✅ |
| Profile + sign out | ✅ | ✅ | ✅ |
| Class reminders + assessments | ✅ | ✅ | ✅ |
| CGPA + history + what-if | ✅ | ✅ | ✅ |
| Lab report drafts | ✅ | ✅ | ✅ |
| Notices | ✅ | ✅ | ✅ |
| Blood bank + donor profile | ✅ | ✅ | ✅ |
| Lost & found | ✅ | ✅ | ✅ |
| Book exchange (listings, saved, chat, reviews) | ✅ | ✅ | ✅ |
| Transport (routes + schedules) | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Image uploads | ✅ | ✅ | ✅ |

Some behaviour changed along with the data source, because the old versions could not work as designed:

- **Blood requests are community-visible.** They previously wrote to the device's own storage, where no potential donor could ever see them.
- **Bus selection is direction-aware.** The same three buses used to appear for every journey; the server now only returns buses whose route reaches your origin *before* your destination.
- **Seller ratings are real averages**, shown as "No reviews yet" rather than a hardcoded `4.9`.
- **Book chat is a real conversation** between the two participants, persisted and access-checked server-side.

**Transport is informational — there is no ticketing.** Campus buses are not booked or seat-reserved, so both clients answer "which bus serves my route, when does it leave, and who do I call". A `Ticket` model existed briefly and was removed in migration `drop_transport_tickets` rather than left as dead schema.

The Book exchange row above is ✅ for the capabilities it names (listings, saved, chat, reviews); the "My Profile" hub screen inside Book Exchange is a narrower exception on the Flutter app only — see [§16](#16-known-gaps).

See [§15](#15-what-changed-from-the-original-app) for the full before/after and [§12](#12-feature-notes) for the reasoning behind each feature.

---

## 6. Configuration

All server environment variables are declared and validated in `src/config/env.js`.

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
| `ALLOWED_EMAIL_DOMAIN` | `aust.edu` (in `.env.example`) | Applies to **every** email-taking endpoint — register, login, forgot-password, resend-verification. Only an `@aust.edu` address is a valid account at all; there is no grandfathering for older domains. Leave blank to allow any domain. |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000,http://localhost:8080` | Comma-separated. `:5173` is the Vite dev server. **`*` is rejected in production** |
| `RATE_LIMIT_MAX` | `300` per minute | Global |
| `AUTH_RATE_LIMIT_MAX` | `10` per 15 min | Auth routes |
| `STORAGE_DIR` | `./storage` | Local upload root |
| `MAX_UPLOAD_BYTES` | `5242880` (5 MB) | |
| `SMTP_*` | *(unset)* | With no host, mail is logged to stdout instead of sent |

### Production-only invariants

The server refuses to boot in production if: `CORS_ORIGINS` contains `*`, `PASSWORD_PEPPER` equals `JWT_ACCESS_SECRET`, `SMTP_HOST` is unset, or `PUBLIC_URL` is not `https://`.

### Web client

One optional variable, read by Vite (`client/src/api/config.ts`):

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | Set in `client/.env` (copy from `.env.example`) to point at a non-default server |

### Ports

| Service | Host port | Why |
| --- | --- | --- |
| Dev database | **5434** | Avoids colliding with a PostgreSQL already installed on the machine |
| Test database | **5433** | Separate, `tmpfs`-backed, so a test run never truncates dev data |
| API | 3000 | |
| Web dev server | 5173 | Vite's default |

Both databases bind to `127.0.0.1` only — without that prefix Docker publishes on `0.0.0.0` and punches through the host firewall.

---

## 7. Data model

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

Reference data, read-only to students. **There is no ticket model** — see [§12](#12-feature-notes).

### Platform

| Model | Notes |
| --- | --- |
| `FileObject` | ownerId, storageKey, originalName, **mime detected from bytes**, sizeBytes, sha256 |
| `Notification` | type (`NOTICE`/`BLOOD_REQUEST`/`BOOK_MESSAGE`/`LOST_FOUND`/`CLASS_REMINDER`/`SYSTEM`), title, body, `payload Json`, readAt |

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

## 8. API reference

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

Mobile clients read `refreshToken` from the JSON body and store it in the OS keychain; the web client uses the `httpOnly` cookie and ignores the body copy.

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
| **Notifications** `/notifications` | `GET /?unreadOnly=&type=` `GET /unread-count` `POST /:id/read` `POST /read-all` — `type` is one of the `Notification` enum values, e.g. `BOOK_MESSAGE` |
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

Both clients unwrap this into a typed error — `ApiException` (Dart) / `ApiError` (TypeScript) — so no view ever parses a raw HTTP response; both expose `.errorFor(field)` for inline form errors and `.isUnauthorized`/`.isValidation`/etc. getters.

---

## 9. Security design

The parts that are easy to regress, and why they are the way they are.

### Passwords

argon2id at 64 MiB / t=3 / p=1, plus a **server-side pepper** from the environment. The pepper never touches the database, so a stolen dump alone cannot mount an offline attack. Hashes are transparently upgraded on next login when the cost parameters are raised.

Policy: ≥10 characters (configurable), mixed case, at least one digit, capped at 72 bytes — a real constraint of the hashing family, beyond which some implementations silently truncate.

### Accounts

Only `@aust.edu` addresses are valid at all (`ALLOWED_EMAIL_DOMAIN`, [§6](#6-configuration)) — enforced on register, login, forgot-password, and resend-verification alike, with no grandfathering for an account created under a looser policy. The demo/seeded accounts comply with this from the start.

### Sessions

- **Access tokens**: 15-minute JWTs, HS256 with the **algorithm pinned** — this blocks `alg: none` and RS/HS confusion attacks, where a token declares its own weaker verification scheme.
- **Refresh tokens**: 30-day opaque 256-bit values, stored **only as SHA-256**. A database dump cannot be replayed as a session.
- **Rotation with reuse detection**: every refresh mints a new token and marks the old one used. Presenting a spent token means it leaked, so the **entire token family is revoked** and the event is audit-logged. Losing a session is a cheap price for containing theft.

Access tokens are *not* checked against the database per request — that is what keeps reads cheap. The trade-off is that a token stays valid until it expires, so the TTL is short and anything that must take effect immediately (ban, password change) revokes the refresh family instead.

**Where each client keeps the two tokens** is covered in [§4](#why-the-two-clients-keep-different-session-storage): mobile keeps both in the Keychain; the web client keeps the refresh token *only* in the server's `httpOnly` cookie and the access token in memory, never in `localStorage`.

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

helmet with a `default-src 'none'` CSP, HSTS in production only, CORS restricted to an explicit allowlist including the web client's dev origin (never `*` — `credentials: true` with a reflected origin would let any site drive authenticated requests), refresh cookie `httpOnly` + `sameSite=strict` + path-scoped to `/api/v1/auth`.

### Dependency auditing

`npm audit --audit-level=high` runs in CI on the server job. It caught two real advisories fixed in this pass:

- **`@fastify/jwt` → `fast-jwt` (critical)**: a JWT auth-bypass via an empty HMAC secret accepted by the async key resolver, plus algorithm-confusion and cache-collision issues. Upgraded `^9.0.4` → `^10.2.2`; the plugin's registration options (`secret`, `sign`, `verify`) are unchanged, so `auth.js` required no code changes. All 79 tests, including the auth suite, pass unchanged.
- **`nodemailer` (high)**: SMTP command injection and header injection advisories. Upgraded `^6.10.0` → `^9.0.5`. `mailer.js` uses only `createTransport({host, port, secure, auth})` and `sendMail({from, to, subject, text})`, which is stable across that range, and the test suite never exercises the real transport (SMTP is unconfigured in test, so mail is logged instead of sent) — so this was a genuinely safe upgrade, verified by a full test run rather than assumed.

### Operational

- Environment validated by Zod at boot; the process exits on a bad or missing secret.
- pino redaction of `authorization`, `cookie`, `set-cookie`, and every `password`/`token`/`hash` field.
- Request ids on every log line; errors logged in full and returned opaquely — only deliberate `AppError`s describe themselves to the client, so Prisma and driver messages cannot leak.
- Audit log on auth and moderation actions.
- Graceful shutdown with a 10-second hard ceiling, so a stalled drain cannot hang a deploy.

---

## 10. Flutter app structure

### Startup

```text
main() → build TokenStore + ApiClient + 3 repositories + AuthService → runApp
       → SplashScreen: restoreSession() ∥ minimum dwell
       → signed in?  HomePage  :  WelcomeScreen
```

`SplashScreen` was a bare timer that always pushed the welcome screen, so a signed-in user had to log in again on every cold start. It now restores the stored session while the logo is on screen.

### Layers

| Layer | Responsibility |
| --- | --- |
| `core/base_view_model.dart` | `ViewState` (idle/busy/error), `runLoad`/`runAction`, `safeNotify()` — shared by every view model |
| `data/api/` | Transport. Token storage, refresh, typed errors |
| `data/repositories/` | One method per endpoint, grouped by domain |
| `data/services/auth_service.dart` | Session state as a `ChangeNotifier` |
| `viewmodels/` | One class per screen, constructor-injected with its repository. Most extend `BaseViewModel`; two (`CGPACalculatorViewModel`, `ClassReminderViewModel`) predate it and extend `ChangeNotifier` directly with their own hand-rolled loading/error fields — not yet reconciled to the shared base |
| `views/` | `StatelessWidget`s wrapping a `ChangeNotifierProvider`; bodies read via `context.watch<XViewModel>()` |
| `views/widgets/async_views.dart` | Shared `LoadingView` / `ErrorView` / `EmptyView` / `AsyncContent` |

Repositories return plain maps rather than re-deriving a Dart model per endpoint: the server response shapes are already the contract, and duplicating them is where drift creeps in. Screens that already had a model (`Task`, `ClassReminderModel`) map at their own edge.

**View models must never import from `views/`.** The dependency direction is view → view model → repository, one-way, which is what makes a view model unit-testable without a widget tree — see [§13](#13-testing).

### Screen conventions

Every screen follows the pattern set by `views/tasks/todo_list_screen.dart`:

1. Build the view model in a `ChangeNotifierProvider`, injecting the repository from `context.read<...Repository>()`.
2. The view model's constructor calls `load()`, which runs through `runLoad` — sets `busy`, catches `ApiException`, stores the message.
3. Render via `AsyncContent` or an explicit loading/error/empty ladder.
4. **Writes are optimistic with rollback** — flip the UI immediately via `runAction`, revert and surface a snackbar if the server rejects it.
5. Pull-to-refresh calls `load(silent: true)` — skips the busy state so the pull indicator doesn't get a redundant spinner underneath it.

The CGPA calculator and class reminder screens follow the same view→viewmodel shape but predate `BaseViewModel`: their view models track `_loading`/`_error` by hand on top of plain `ChangeNotifier` rather than calling `runLoad`/`runAction`. Behaviourally equivalent, just not yet reconciled to the shared base class.

---

## 11. Web client structure

The web client is a from-scratch React rebuild that mirrors the Flutter app's screens and layering, not a port of its widget code — Tailwind components instead of Flutter widgets, but the same views, the same view-model boundary, and after this pass, the same backend.

### Layers

| Layer | Responsibility | Flutter equivalent |
| --- | --- | --- |
| `api/client.ts`, `config.ts`, `errors.ts` | Transport: the fetch wrapper, base URL, typed `ApiError` | `data/api/` |
| `repositories/academic.ts`, `community.ts`, `platform.ts` | One method per endpoint, same grouping | `data/repositories/` |
| `viewmodels/*` (30 hooks) + `AuthContext`, `CgpaContext`, `BloodBankContext` | State and mutations, one `useXViewModel()` per screen | `viewmodels/` |
| `views/*` (29 route components) | Presentational; reads its view model's return value, dispatches its functions back | `views/` |
| `components/*` (30 shared pieces) | `AsyncState.tsx` (`LoadingState`/`ErrorState`) is the direct analogue of `async_views.dart` | `views/widgets/` |
| `models/*` | TypeScript interfaces plus small mapper functions (`toBookListing`, `toChatMessage`, …) that flatten a server row into the shape a view already expects | Model classes / inline maps |

### Screen conventions

Every view follows the same shape as the Flutter screens:

1. `const vm = useXViewModel();` — one hook, called once, at the top of the component.
2. The hook's own `useEffect` calls `load()` on mount (and on a debounce for search-driven screens, matching the pattern in `useNoticeBoardViewModel`/`useLostFoundViewModel`/`useBookExchangeViewModel`).
3. The view renders a `loading` / `error` / empty / content ladder using `LoadingState`/`ErrorState` from `components/AsyncState.tsx`.
4. **Writes are optimistic with rollback**, the same as Flutter — e.g. `useClassReminderViewModel.toggleReminder` flips `isEnabled` immediately and reverts it if `academicRepository.updateClassReminder` rejects.
5. A hook never imports from `views/`, mirroring the Flutter rule — the boundary is what lets `useClassReminderViewModel.test.ts` mock the repository and test the hook with no DOM at all beyond what `renderHook` needs.

### Where the web client diverges from a straight port

A handful of screens needed a real decision rather than a mechanical translation, because the web client's original mockup had gaps the Flutter app didn't:

- **Book notifications.** The mockup showed two hardcoded rows ("Shahidul Islam Arman replied to you"). The Flutter equivalent (`book_notification_page.dart`) is *also* still a hardcoded TODO stub — a genuine pre-existing gap on that side, left alone in this pass. On the web side, since the general notification feed already exists and is tested, `useBookNotificationsViewModel` was wired to `GET /notifications?type=BOOK_MESSAGE` instead of carrying the fake rows forward — a small server change (an optional `type` filter added to the existing endpoint) rather than inventing a new one.
- **Listing detail and seller profile fetch by id**, not by navigation state. Flutter's `ListingDetailPage`/`SellerProfilePage` receive the listing/seller as a constructor argument passed from the previous screen — fine for an app with no deep links. The web routes (`/book-exchange/:id`, `/book-exchange/seller/:id`) are shareable URLs, so their view models call `communityRepository.listing(id)` / `sellerReviews(id)` directly, which also means a page reload doesn't lose the screen.
- **Chat resolves the listing itself**, for the same reason — reloading `/book-exchange/chat/:id` still shows the right seller name and book banner because the hook fetches the listing rather than depending on router state that a refresh would discard.
- **The search box on Book Exchange was wired for the first time.** It rendered with no `value`/`onChange` at all in the mockup — a dead input, not a fixture; fixed alongside the repository wiring.
- **The bus receipt screen's copy was corrected.** It read "Booking Confirmed", which implies a reservation that doesn't exist — campus buses aren't ticketed (see [§12](#12-feature-notes)). Now reads "Route & Schedule", matching the Flutter screen's own comment that it "confirms nothing."

### Theme

`src/index.css` defines the same token *names* the mockup always had (`--color-darkgreen`, `--color-mint`, …) but the *values* were remapped in this pass to the Flutter app's real palette (`AppColors`/`CgpaColors` in `theme/app_colors.dart`) so the two clients read as the same product. All 29 views compiled unchanged, since only the values moved, not the names. The web client keeps its own typography stack (Inter / Space Grotesk / IBM Plex Mono) — a deliberate exception, not an oversight, since it was judged better than forcing the app's single font onto a denser desktop layout.

---

## 12. Feature notes

### Dashboard

Every chip is computed. Previously each was a literal string in the widget/component tree (`'3 due today'`, `'Current: 3.72'`, `'14 listings'`, `'2 requests nearby'`) on both clients. Chips **hide entirely** while loading or on failure rather than showing a placeholder — an empty pill reads as "zero", which is a different claim from "not loaded".

CGPA is reported as `null` (rendered "No grades yet") rather than `0.00` for a student with no grades. "You have a 0.00 CGPA" would be alarming and wrong.

### CGPA

The grade scale is copied from the app's original `CourseGradeModel.gradePoint` so both clients and the server can never disagree: A+ 4.00, A 3.75, A− 3.50, B+ 3.25, B 3.00, B− 2.75, C 2.50, D 2.00, F 0.00.

GPA is a **credit-weighted mean** — a 3-credit A+ and a 1-credit F average to 3.00, not 2.00. `GET /cgpa/summary` returns a running cumulative CGPA per semester.

`POST /cgpa/what-if` projects hypothetical courses against the real transcript without persisting them. Both clients keep the what-if *simulation* itself client-side (it's a hypothetical projection, not a fact to store), while the real cumulative CGPA shown everywhere else is server-computed.

### Blood bank

The 90-day donation interval moved from the client to the server and is now authoritative. A medical-adjacent rule should not be able to drift between screens, let alone between app versions still installed on phones, or between two different client codebases. Boundary behaviour is pinned by tests: not eligible at day 89, eligible exactly at day 90, never negative days remaining. Both clients render the server's `eligible`/`daysUntilEligible`/`progress`/`statusCopy` fields directly rather than recomputing them.

**Requests are community-visible** — contact numbers are exposed to any signed-in user. That is the intended trade-off (a request only helps if strangers can see it) and is why the endpoint requires a session and is not public. Only the requester can change a request's status; closing someone else's would be a trivial way to hide an urgent appeal.

### Book exchange

Browse / My Listings / Saved and all four sort orders run server-side, on both clients. Conversations are keyed `(listingId, buyerId)` so reopening a chat never forks a new thread, and a third party holding a conversation id gets 404 on both read and write.

Seller ratings are real averages over `SellerReview`, shown as "No reviews yet"/"—" when there are none rather than the hardcoded `4.9` every seller used to display on both clients.

Posting a listing uploads images **first**, then creates the listing — the reverse order can leave a listing referencing files that never arrived.

### Transport

**Informational only. There is no ticketing.** Campus buses are not booked or seat-reserved, so the feature answers "which bus serves my route, when does it leave, and who do I call". A `Ticket` model existed briefly and was removed in migration `drop_transport_tickets` rather than left as dead schema.

Departure search is **direction-aware**: the server only returns buses whose route reaches the origin *before* the destination, so the reverse direction correctly returns nothing even though the bus visits both stops.

The schedule *time-slot list* (06:00, 08:30, 01:30 pm, …) stays a client-side constant on both clients, matching a deliberate choice already made on the Flutter side (`schedule_page.dart`) — those slots are display-only; the actual departure time shown once a bus is picked always comes from the server record.

### Lost & found

Search and category filtering moved from an in-memory filter over a handful of hardcoded items (five on the app, two on the web mockup) to server-side queries across every item on campus, on both clients. Filter chips are built from categories actually in use, so a new one appears as soon as someone reports it.

### Notices

The one asymmetric module: all signed-in users read, only `MODERATOR`/`ADMIN` write. A student attempting to post gets **403, not 404** — the route exists and they are authenticated, so this is a genuine permission failure and hiding it would only confuse. Deletes are soft.

---

## 13. Testing

```bash
cd server && npm run lint && npm test                       # 79 tests
cd mobile/aust-central && flutter analyze && flutter test   # 14 tests
cd client && npm run lint && npx tsc -b && npm test          # 10 tests
```

### Server

Tests run against a **real PostgreSQL** in Docker (port 5433), with migrations applied before the first file and every table truncated between cases. The truncate list is derived from the live catalogue, not hardcoded, so a new model cannot silently start leaking rows across tests. Tests drive the real Fastify instance through `inject()` rather than a mock, so plugins, hooks, validation, and the error handler are all exercised — the security behaviour lives in those layers, not the handlers.

| File | Tests | Focus |
| --- | --- | --- |
| `auth.test.js` | 25 | Registration, login, rotation, reuse detection, lockout, enumeration resistance, password change |
| `security.test.js` | 36 | Cross-module authorisation boundaries, plus the boolean-query-coercion and notification-idempotency regressions below |
| `tasks.test.js` | 8 | CRUD + the ownership pattern all modules share |
| `calculations.test.js` | 10 | GPA maths and blood eligibility boundaries (no DB) |

Registration/login domain restriction is forced **off** during tests (`test/test-env.js` sets `ALLOWED_EMAIL_DOMAIN=''` unconditionally, before any app code loads `.env`), because every test that creates a user registers with an `@example.com` address (`test/helpers/auth.js`) — a locally-enabled restriction must never leak into the suite from a developer's `.env`.

Security regressions pinned as first-class tests:

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
- `?mine=false` and `?unreadOnly=false` are treated as `false`, not `true` — `z.coerce.boolean()` reads the *string* `"false"` as truthy, which silently inverted these filters until caught by manual emulator testing and fixed with a custom `booleanQuery()` Zod helper
- Re-marking an already-read notification is a 204 no-op, not a 404 — but another user's notification is still a genuine 404

### App

`mobile/aust-central/test/`:

| Path | What |
| --- | --- |
| `fakes/fake_academic_repository.dart` | Implements `AcademicRepository`'s implicit interface with in-memory state; methods outside the current suite's scope throw loudly rather than silently no-op |
| `viewmodels/task_list_view_model_test.dart` | 7 tests: load, load failure, filtering, create, optimistic toggle + rollback, optimistic delete + rollback |
| `viewmodels/class_reminder_view_model_test.dart` | 3 tests: load + time-format conversion, optimistic toggle + rollback, reload-after-create |
| `widgets/todo_list_screen_test.dart` | 4 widget tests: renders loaded tasks, empty state, error state with retry, tapping the toggle updates the header count |

No HTTP, no widget tree for the view-model tests — a fake repository is handed to the same constructor the real screen uses (`TaskListViewModel(repo)`), which is the entire reason `BaseViewModel` takes its repository by constructor injection rather than reading a singleton.

### Web

`client/src/`:

| Path | What |
| --- | --- |
| `api/client.test.ts` | 6 tests: `Content-Type` omitted on a bodyless request, sent when there's a body, two concurrent 401s collapse onto one refresh call, `onSessionExpired` fires when refresh itself fails, `/auth/*` paths never trigger a refresh loop |
| `viewmodels/useClassReminderViewModel.test.ts` | 4 tests: same scenarios as the Flutter test above, via `vi.mock('../repositories/academic')` and `renderHook`, verifying both clients' identical view model contract independently |

### CI

`.github/workflows/ci.yml` — three independent jobs on every push and PR:

| Job | Steps |
| --- | --- |
| `server` | `npm ci` → `prisma generate` → `npm run lint` → `npm test` (against a `postgres-test` service container matching `docker-compose.yml`) → `npm audit --audit-level=high` |
| `app` | `flutter pub get` → `flutter analyze` → `flutter test` |
| `web` | `npm ci` → `npm run lint` → `tsc -b` → `npm test` → `npm run build` |

### Not covered

- **The web client has not been exercised in a real browser end to end** in this pass beyond the automated suite above (register → login → reload-persists-session → CRUD per feature → sign out). The Flutter app *has* been driven live on an Android emulator against the real server in an earlier pass.
- **Cross-client proof** (create a listing on web, see it on the app; message from the app, see it on web) has not been performed — both sides are independently verified against the same API and the same tests, but not against each other in the same run.

---

## 14. Migration history

| Migration | Contents |
| --- | --- |
| `20260815110801_init` | All 28 models, enums, indexes |
| `20260815110900_add_check_constraints` | Hand-written CHECK constraints Prisma cannot express |
| `20260815120606_drop_transport_tickets` | Removed `Ticket` and `TicketStatus` |

No new migrations in the web-integration pass — the schema already had everything both clients needed; the `notifications` `type` filter (see [§11](#11-web-client-structure)) is a query-parameter addition, not a schema change.

---

## 15. What changed from the original app

### Removed

- **Firebase entirely** — `firebase_core`, `firebase_auth`, the Gradle plugin, the BOM, `firebase-analytics`, and `google-services.json`. It provided only email/password auth, and because `Firebase.initializeApp()` was called with no Dart options, the app depended on native config that **only Android had** — iOS, web, and desktop crashed at launch. With Firebase gone, every platform boots.
- **The plaintext password store.** Login wrote the raw password to `SharedPreferences` under `saved_password`, in a file readable by any process running as the same user on a rooted device. The app now stores only tokens, in the Keychain, and **actively deletes the old key on launch** for anyone upgrading. Tokens can be revoked server-side; a password cannot.
- `blood_request_service.dart` — its `SharedPreferences` store is now dead weight.
- Unused dependencies: `google_nav_bar`, `google_fonts`, `dropdown_search`.
- **Ten web client fixture files** (`client/src/data/*.ts`) — `books.ts`, `busData.ts`, `bloodRequests.ts`, `bookNotifications.ts`, `chatMessages.ts`, `classReminders.ts`, `cgpaCourses.ts`, `lostFoundItems.ts`, `notices.ts`, `user.ts` — and `client/src/utils/auth.ts`, the `localStorage` boolean that stood in for a session.

### Fixed

- **`INTERNET` permission added to the main manifest.** It was declared only in the debug and profile manifests, so a release APK would have installed with **no network access** and every call would have failed silently.
- **Session persistence** — a valid session now skips the login screen, on both clients.
- **App label** unified to `AUST Central`.
- **Network security config** added: cleartext HTTP permitted only for loopback dev addresses (`10.0.2.2`, `127.0.0.1`, `localhost`), denied everywhere else. Android blocks cleartext by default since API 28, so without this the app could not reach the dev server at all — and with a blanket `cleartextTrafficPermitted="true"` a production misconfiguration would silently ship tokens in the clear.
- Book post form was **pre-filled with sample content** a distracted user could publish verbatim; fields now start empty. It was also **missing department, semester, and any price input** despite offering a "Fixed Price" option.
- **Two bugs found only by running the real app against the real server**, not by an automated API sweep: a global `Content-Type: application/json` header broke every bodyless request (DELETE, some POST/PUT), since Fastify rejects a declared-JSON body that is empty; and `z.coerce.boolean()` read the query string `"false"` as JavaScript's `Boolean("false") === true`, silently inverting `?mine=false` and `?unreadOnly=false`. Both are now covered by regression tests (see [§13](#13-testing)).
- **A dead search box** on the web client's Book Exchange screen, and **misleading "Booking Confirmed" copy** on the transport receipt screen — see [§11](#where-the-web-client-diverges-from-a-straight-port).
- **Registration email hints** (`demo@email.com`) on both clients now read `you@aust.edu`, matching the enforced domain restriction.

### Behaviour that genuinely changed

| Before | After |
| --- | --- |
| Blood requests saved to the device only — no donor could ever see them | Community-visible |
| Same three buses shown for every journey | Only buses actually serving that route, in that direction |
| Every seller rated `4.9` | Real averages, or honestly absent |
| Chat was two sample messages, identical for every seller, lost on pop/reload | Real persisted conversation between the two participants |
| To-do list lost everything on screen pop / page reload | Persisted per user |
| Class reminder toggles changed nothing | Persisted |
| Lost & found searched a handful of hardcoded items | Searches every item on campus |
| Web client "logged in" state was a `localStorage` boolean | Real session: `httpOnly` refresh cookie + in-memory access token |
| Any email domain could register and sign in | Only `@aust.edu` — enforced everywhere, not just at signup |

---

## 16. Known gaps

### Release blockers (mobile)

Both need a decision, not a code change:

- **`applicationId` is `com.example.aust_track`.** Play rejects `com.example.*`. A real package name (e.g. `edu.aust.central`) must be applied to the Gradle namespace, the Kotlin source path, and `MainActivity.kt`.
- **Release builds sign with the debug keystore.** A real upload key must be generated and referenced from a `signingConfig`, with credentials kept out of the repo.

### Operational

- **Local disk uploads** don't survive container replacement and won't scale past one host. The `FileObject` indirection means swapping in S3/R2 later touches one module.
- **Production needs TLS** terminated at a proxy, with `PUBLIC_URL` set to `https://` — env validation refuses to boot otherwise. If the web client and API ever ship on different top-level domains (rather than different ports of one host, as in dev), `sameSite=strict` on the refresh cookie would need reassessing — never loosen it to `sameSite=none` without also being on HTTPS.
- **Existing Firebase accounts** cannot be migrated: password hashes cannot be exported from Firebase, so a forced reset is the realistic path.

### Technical debt

- **Two Flutter screens inside Book Exchange are still hardcoded**, neither backed by a view model or repository:
  - `book_exchange/book_notification_page.dart` — two fake notification rows. Its web counterpart *was* wired to the real feed in this pass (`GET /notifications?type=BOOK_MESSAGE`, see [§11](#where-the-web-client-diverges-from-a-straight-port)); this Flutter screen remains open.
  - `book_exchange/book_profile_page.dart` ("My Profile" inside Book Exchange) — literal `'Your Name'` and a hardcoded `4.9` rating, and every menu row (`My Listings`, `Saved Books`, `Exchange History`, `Settings`) is an empty `onTap` with a `// TODO: navigate to …` comment. Its web counterpart (`BookProfileView`/`useBookProfileViewModel`) is real — it reads the signed-in user from `AuthContext` and computes an actual review average, so this is a client asymmetry, not a missing backend capability. (`views/profile/profile_screen.dart`, the *account-level* profile reached from the main nav, is unrelated and is fully wired to `AuthService`.)

  (The *generic* `views/notifications/notifications_screen.dart` is neither of these — it is fully wired to `NotificationsViewModel` and `PlatformRepository.notifications()`, same as every other migrated screen; see [§10](#10-flutter-app-structure).)
- **Cross-client verification is automated-only.** See [§13 → Not covered](#not-covered).
- Two greens remain intentionally distinct: `AppColors.darkGreen` (`#1B4332`) and `CgpaColors.primary` (`#407362`). The web theme pass aligned to `AppColors`, so the CGPA screens on both clients stay visually distinct from the rest of the app — a design call that predates this pass and was left open rather than silently unified.
- `flutter analyze` reports ~15 info-level lints, mostly deprecated `withOpacity`/`activeColor`/`value` in pre-existing widget code and a couple of stylistic `if`-vs-`?` null-check suggestions — none are errors, none are new in this pass.
- **No TypeScript on the server** means Prisma↔Zod schema drift is only caught at runtime, which is why response-schema tests matter more than usual here.

---

## 17. Troubleshooting

**`P1000: Authentication failed against database server`**
Something else is on the port. If you have PostgreSQL installed locally it owns 5432, and Prisma will connect to *it* rather than the container. Ours is on **5434** — check `DATABASE_URL`.

**All endpoints 404 but `/auth/login` works**
A stale server process is holding port 3000 and serving older code. `pkill` does not work on Windows:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**`Invalid environment configuration` on boot**
Working as designed. The message lists exactly which variables are missing or too short. `.env` is loaded via Node's built-in `process.loadEnvFile`; variables already in the environment win.

**Edited `.env` but the server still behaves like the old config**
`npm run dev` uses `node --watch`, which restarts on a source-file change but does not reliably re-read `.env` on its own. Stop it (see above) and start it fresh after editing `.env`.

**`EPERM: operation not permitted, rename … query_engine-windows.dll.node`**
`prisma generate` cannot replace the engine while a node process holds it. Stop the dev server and any test run, then re-run.

**App can't reach the server from an emulator**
Use `10.0.2.2`, not `localhost` — on an emulator `localhost` is the emulated device itself. This is already the default.

**Web client gets CORS errors, or the session doesn't survive a reload**
Check `CORS_ORIGINS` in `server/.env` includes `http://localhost:5173` (the default already does), and that requests are going through `credentials: 'include'` (every call in `api/client.ts` already sets this). If the server and the web client run on different hosts (not just different ports of `localhost`), the `sameSite=strict` refresh cookie will not be sent cross-site by design — that combination needs a same-site deployment (a reverse proxy putting both under one host) rather than a cookie-policy change.

**`flutter test` fails**
It shouldn't — the stock counter template (`test/widget_test.dart`) that used to fail here was replaced with real tests in this pass (see [§13](#13-testing)). If it's failing now, that's a real regression; use `flutter analyze` alongside it, not instead of it.

**Migrating the test database fails**
`docker compose up -d postgres-test`. The suite applies migrations itself before the first test file.

---

## 18. Appendix: verification snapshot

```text
--- Server ---
npm run lint              exit 0
npm test                  79 passed (4 files)
npm audit --audit-level=high   0 vulnerabilities (fast-jwt + nodemailer upgraded)

--- App ---
flutter analyze           0 errors, ~15 info (pre-existing, none new)
flutter test              14 passed
flutter build apk         Built app-debug.apk, exit 0

--- Web ---
npm run lint               exit 0
npx tsc -b                 exit 0
npm test                   10 passed (2 files)
npm run build               production build succeeds

--- CI ---
.github/workflows/ci.yml   server / app / web — 3 jobs, independent
```
