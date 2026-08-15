# AUST Central

A campus companion app for students of Ahsanullah University of Science and Technology (AUST) — class reminders, CGPA tracking, campus transport, a blood-donor network, a textbook exchange, lost & found, and notices.

Two parts: a **Flutter app** and a **Node/Fastify/PostgreSQL API** that owns all of its data.

> **Status: beta.** Every feature is wired end to end — the app reads and writes real data through the API, and no screen renders hardcoded fixtures any more. Remaining work is release engineering, not features: see [Known gaps](#known-gaps).

## Repository layout

| Path | Contents |
| --- | --- |
| [mobile/aust-central/](mobile/aust-central/) | Flutter app. The Dart package is **`aust_track`** — imports are `package:aust_track/...`. |
| [server/](server/) | Node 22 + Fastify 5 + PostgreSQL API. Plain JavaScript, Prisma, Zod. See its [README](server/README.md). |
| [client/](client/) | Empty placeholder for a future web client. |

## Quick start

Run the server first — the app needs it to sign in.

```bash
# 1. API
cd server
npm install
cp .env.example .env          # then fill in the two secrets (see server/README.md)
docker compose up -d postgres postgres-test
npm run db:migrate
npm run db:seed               # demo accounts + the app's original fixtures
npm run dev                   # http://localhost:3000

# 2. App
cd ../mobile/aust-central
flutter pub get
flutter run
```

Seeded logins (password `DemoPassword1`):

| Account | Role |
| --- | --- |
| `farhana@aust-central.local` | Student, with tasks/grades/reminders |
| `arman@aust-central.local` | Student, book seller |
| `admin@aust-central.local` | Admin, can post notices |

The Android emulator reaches the host on `10.0.2.2`, which the app already defaults to. For a physical device, point it at your machine:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000/api/v1
```

## Architecture

```text
Flutter app                      API server
────────────                     ──────────
screens/            ──uses──►    /api/v1/...
repositories/       ──HTTP──►    modules/<domain>/{routes,service,schema}.js
api/ApiClient       ──auth──►    JWT access + rotating refresh
api/TokenStore                   PostgreSQL via Prisma
  (Keychain)
```

`ApiClient` attaches the access token to every request and refreshes once on a 401, collapsing concurrent refreshes onto a single call — the server treats a replayed refresh token as theft and revokes the session family, so a chatty client must not race itself.

**Firebase has been removed entirely.** It previously provided only email/password auth, and because `Firebase.initializeApp()` was called with no Dart options, the app depended on native config that only Android had — so iOS, web, and desktop crashed on launch. With Firebase gone, every platform boots.

## Migration status

| Feature | API | App |
| --- | --- | --- |
| Auth (register/login/refresh/reset) | ✅ | ✅ |
| Session persistence across restarts | ✅ | ✅ |
| Dashboard counters | ✅ | ✅ |
| To-do list | ✅ | ✅ |
| Profile + sign out | ✅ | ✅ |
| Class reminders + assessments | ✅ | ✅ |
| CGPA + history + what-if | ✅ | ✅ |
| Lab report drafts | ✅ | ✅ |
| Notices | ✅ | ✅ |
| Blood bank + donor profile | ✅ | ✅ |
| Lost & found | ✅ | ✅ |
| Book exchange (listings, saved, chat, reviews) | ✅ | ✅ |
| Transport (routes + schedules) | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Image uploads | ✅ | ✅ |

Some behaviour changed along with the data source, because the old versions could not work as designed:

- **Blood requests are community-visible.** They previously wrote to the device's own storage, where no potential donor could ever see them.
- **Bus selection is direction-aware.** The same three buses used to appear for every journey; the server now only returns buses whose route reaches your origin *before* your destination.
- **Seller ratings are real averages**, shown as "No reviews yet" rather than a hardcoded `4.9`.
- **Book chat is a real conversation** between the two participants, persisted and access-checked server-side.

**Transport is informational — there is no ticketing.** Campus buses are not booked or seat-reserved, so the app answers "which bus serves my route, when does it leave, and who do I call". A `Ticket` model existed briefly and was removed in migration `drop_transport_tickets` rather than left as dead schema.

## Security notes

The full posture is in [server/README.md](server/README.md). Two changes worth calling out here:

- **The plaintext password store is gone.** Login used to write the raw password into `SharedPreferences` under `saved_password`. The app now stores only tokens, in the Keychain / EncryptedSharedPreferences via [TokenStore](mobile/aust-central/lib/api/token_store.dart), and actively deletes the old key on launch. Tokens can be revoked server-side; a password cannot.
- **Ownership is enforced server-side on every row.** A resource you do not own returns 404, never 403 — a 403 would confirm the id exists.

## Testing

```bash
cd server && npm run lint && npm test    # 74 tests, incl. security regressions
cd mobile/aust-central && flutter analyze
```

The server suite runs against a real PostgreSQL in Docker and covers refresh-token reuse detection, account-enumeration resistance, cross-user access, RBAC, and upload magic-byte validation.

`mobile/aust-central/test/widget_test.dart` is still the stock Flutter counter template and fails — pre-existing, not a regression. There is no CI yet.

## Known gaps

Before any release build — both need a decision from you, not a code change:

- **`applicationId` is still `com.example.aust_track`.** Play rejects `com.example.*`, so this needs a real package name (e.g. `edu.aust.central`) applied to the Gradle namespace, the Kotlin source path, and `MainActivity.kt`.
- **Release builds sign with the debug keystore.** A real upload key must be generated and referenced from a `signingConfig`, with the credentials kept out of the repo.

Already fixed in this pass: `INTERNET` added to the main manifest (a release APK previously installed with no network access), Firebase removed from Gradle, app label set to `AUST Central`, and a [network security config](mobile/aust-central/android/app/src/main/res/xml/network_security_config.xml) that permits cleartext only for loopback dev addresses.

Operationally, the server serves plain HTTP in development; production must terminate TLS at a proxy and set `PUBLIC_URL` to `https://` — env validation refuses to boot otherwise.
