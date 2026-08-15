import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { ApiError } from './errors';

/**
 * The single HTTP entry point for the web app.
 *
 * Mirrors mobile/aust-central/lib/data/api/api_client.dart, including its two
 * hard-won lessons:
 *
 *  1. `Content-Type: application/json` is attached ONLY when a body is
 *     present. A bodyless request that still declares JSON is rejected by the
 *     server — "Body cannot be empty when content-type is set to
 *     'application/json'" — which broke every DELETE on mobile until fixed.
 *  2. Refresh is guarded by a single in-flight promise. Parallel 401s must
 *     collapse onto one refresh call — the server rotates refresh tokens and
 *     treats a replay as theft, so two concurrent refresh attempts would
 *     revoke the whole session and sign the user out.
 *
 * Session model: the **refresh token** lives only in the server's httpOnly
 * cookie (`credentials: 'include'` on every call; the browser attaches and
 * reads it, JavaScript never touches it — the entire point of choosing a
 * cookie over localStorage). The **access token** is short-lived (15 min) and
 * kept in a module-level variable, never in localStorage/sessionStorage, so it
 * does not survive a reload — that is recovered via one refresh call, the same
 * way the Flutter app recovers its session on cold start.
 */

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** Registered once by AuthContext; called when refresh fails outright. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

type SessionPayload = { accessToken: string };

/** Refresh, collapsing concurrent callers onto one in-flight request. */
async function refreshOnce(): Promise<boolean> {
  return (refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  }));
}

async function performRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      // No body: the refresh token travels via the httpOnly cookie, so this
      // request must NOT declare a JSON content type — see the class note.
    });
    if (!response.ok) return false;
    const data = (await response.json()) as SessionPayload;
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Already unreachable or already invalid server-side; clearing locally
    // is what matters to the caller.
  } finally {
    accessToken = null;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Internal: set on the retried call to prevent an infinite refresh loop. */
  _retried?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, _retried = false } = options;

  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  // Only declared when there is actually a body — see the class note.
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    clearTimeout(timeout);
    throw ApiError.network(cause);
  }
  clearTimeout(timeout);

  if (response.status === 401 && !path.startsWith('/auth/') && !_retried) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return request<T>(path, { ...options, _retried: true });
    }
    onSessionExpired?.();
    throw await ApiError.fromResponse(response);
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  /** Multipart upload — browser sets the multipart boundary itself. */
  async uploadFile<T>(path: string, file: File): Promise<T> {
    const form = new FormData();
    form.append('file', file);

    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: form,
    });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return (await response.json()) as T;
  },
};
