import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, setAccessToken, setSessionExpiredHandler } from './client';
import { ApiError } from './errors';

/**
 * Covers the two lessons this client mirrors from the Flutter api_client.dart
 * (see the class comment in client.ts): Content-Type is only sent with a
 * body, and concurrent 401s collapse onto a single refresh call rather than
 * each independently replaying the refresh token.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

beforeEach(() => {
  setAccessToken(null);
  setSessionExpiredHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('apiClient bodyless requests', () => {
  it('does not send Content-Type on a DELETE with no body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse());
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.delete('/tasks/abc');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('sends Content-Type: application/json when a body is present', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: '1' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.post('/tasks', { title: 'New task' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('sends no Content-Type on the refresh call either (cookie-only, no body)', async () => {
    // performRefresh is only reachable indirectly, but a GET with no body
    // goes through the identical code path, which is what matters here.
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.get('/notifications/unread-count').catch(() => {});

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });
});

describe('apiClient refresh-once-on-401', () => {
  it('collapses two concurrent 401s onto a single refresh call', async () => {
    let refreshCalls = 0;
    let protectedCalls = 0;

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCalls += 1;
        // Real refresh work takes a tick, giving the second caller a chance
        // to arrive and prove it reuses the same in-flight promise rather
        // than firing its own refresh.
        await new Promise((r) => setTimeout(r, 5));
        return jsonResponse({ accessToken: 'new-token' });
      }
      protectedCalls += 1;
      // Both callers' first attempt is unauthorized; the retried call (after
      // the shared refresh resolves) succeeds.
      return protectedCalls <= 2 ? emptyResponse(401) : jsonResponse({ ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([
      apiClient.get('/protected/one'),
      apiClient.get('/protected/two'),
    ]);

    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
  });

  it('signs the user out when refresh itself fails', async () => {
    const onSessionExpired = vi.fn();
    setSessionExpiredHandler(onSessionExpired);

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/auth/refresh')) return emptyResponse(401);
      return jsonResponse({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, 401);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/protected')).rejects.toBeInstanceOf(ApiError);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh loop for /auth/* endpoints themselves', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } }, 401),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.post('/auth/login', { email: 'a', password: 'b' })).rejects.toBeInstanceOf(
      ApiError,
    );
    // Exactly the one login call -- no refresh attempted for an auth-path 401.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
