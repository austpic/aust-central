# AUST Central — Web Client

React 19 + TypeScript + Tailwind CSS v4 web client for AUST Central, talking to the same [API server](../server/) as the [Flutter app](../mobile/aust-central/) — same endpoints, same auth model, same business rules. See the [project README](../README.md) for the full picture (architecture, API reference, security design, testing, everything); this file is just the web client's quick start.

## Quick start

The server must be running first — see [server/README.md](../server/README.md).

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

No `.env` is required for local dev: `src/api/config.ts` defaults `VITE_API_BASE_URL` to `http://localhost:3000/api/v1`. Copy `.env.example` to `.env` only if the server runs somewhere else.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | oxlint |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run preview` | Serve the production build locally |

## Architecture

Mirrors the Flutter app's layering one-for-one, so a change in one is easy to port to the other:

```text
src/
  api/            client.ts (fetch wrapper), config.ts, errors.ts
  repositories/   academic.ts · community.ts · platform.ts — one method per endpoint
  viewmodels/     30 hooks (useXViewModel) + AuthContext, CgpaContext, BloodBankContext
  models/         TypeScript interfaces + display mappers
  views/          29 route components — presentational, one useXViewModel() each
  components/     30 shared UI pieces
```

`api/client.ts` carries over the two lessons the Flutter `api_client.dart` learned the hard way: `Content-Type` is only sent when a request actually has a body (Fastify rejects a bodyless request that still declares JSON), and a 401 triggers at most one refresh — concurrent 401s collapse onto a single in-flight promise, because the server treats a replayed refresh token as theft.

**Session model differs from mobile by design.** The refresh token lives only in the server's `httpOnly`, `sameSite=strict` cookie, scoped to `/api/v1/auth` — JavaScript never touches it, which is the point of choosing a cookie over `localStorage` for a browser client. The access token lives in a module-level variable only, never in `localStorage`/`sessionStorage`, so it does not survive a reload; `AuthContext` recovers it with one `/auth/refresh` call on mount, same as the Flutter app recovers its session from the Keychain on cold start.

## Testing

```bash
npm test
```

Vitest + Testing Library. `src/api/client.test.ts` covers the bodyless-request and refresh-mutex behavior above with a mocked `fetch`; `src/viewmodels/useClassReminderViewModel.test.ts` covers a view model end to end with a mocked repository, mirroring the equivalent Flutter test in `mobile/aust-central/test/`.
