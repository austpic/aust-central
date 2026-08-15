import { beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, useCleanDatabase } from './helpers/app.js';
import { createUser } from './helpers/auth.js';

/**
 * Tasks suite — also the reference for how every user-owned module is tested.
 * The cross-user cases here are the ones that matter most: they pin the
 * ownership boundary that all ten feature modules share.
 */

let app;
beforeAll(async () => {
  app = await createTestApp();
});
useCleanDatabase(() => app);

const url = '/api/v1/tasks';

describe('tasks CRUD', () => {
  it('rejects anonymous callers', async () => {
    const response = await app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(401);
  });

  it('creates and lists a task', async () => {
    const user = await createUser(app);

    const created = await app.inject({
      method: 'POST',
      url,
      headers: user.headers,
      payload: { title: 'Finish DLD assignment', category: 'TODAY' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().title).toBe('Finish DLD assignment');

    const list = await app.inject({ method: 'GET', url, headers: user.headers });
    expect(list.statusCode).toBe(200);
    expect(list.json().items).toHaveLength(1);
  });

  it('validates the payload', async () => {
    const user = await createUser(app);
    const response = await app.inject({
      method: 'POST',
      url,
      headers: user.headers,
      payload: { title: '' },
    });
    expect(response.statusCode).toBe(422);
  });

  it('updates and completes a task', async () => {
    const user = await createUser(app);
    const created = await app.inject({
      method: 'POST',
      url,
      headers: user.headers,
      payload: { title: 'Read chapter 4' },
    });
    const { id } = created.json();

    const updated = await app.inject({
      method: 'PATCH',
      url: `${url}/${id}`,
      headers: user.headers,
      payload: { isDone: true },
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json().isDone).toBe(true);
  });

  it('deletes a task', async () => {
    const user = await createUser(app);
    const created = await app.inject({
      method: 'POST',
      url,
      headers: user.headers,
      payload: { title: 'Temporary' },
    });
    const { id } = created.json();

    const deleted = await app.inject({
      method: 'DELETE',
      url: `${url}/${id}`,
      headers: user.headers,
    });
    expect(deleted.statusCode).toBe(204);

    const after = await app.inject({
      method: 'GET',
      url: `${url}/${id}`,
      headers: user.headers,
    });
    expect(after.statusCode).toBe(404);
  });

  it('filters by tab', async () => {
    const user = await createUser(app);
    await app.inject({
      method: 'POST', url, headers: user.headers,
      payload: { title: 'Today thing', category: 'TODAY' },
    });
    await app.inject({
      method: 'POST', url, headers: user.headers,
      payload: { title: 'Later thing', category: 'LATER' },
    });

    const later = await app.inject({
      method: 'GET',
      url: `${url}?filter=later`,
      headers: user.headers,
    });
    expect(later.json().items).toHaveLength(1);
    expect(later.json().items[0].title).toBe('Later thing');
  });
});

describe('tasks ownership', () => {
  it("never returns another user's tasks in the list", async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);

    await app.inject({
      method: 'POST', url, headers: alice.headers,
      payload: { title: "Alice's private task" },
    });

    const bobList = await app.inject({ method: 'GET', url, headers: bob.headers });
    expect(bobList.json().items).toHaveLength(0);
  });

  it("returns 404 — not 403 — for another user's task", async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);

    const created = await app.inject({
      method: 'POST', url, headers: alice.headers,
      payload: { title: 'Secret' },
    });
    const { id } = created.json();

    // 403 would confirm the id exists. 404 leaves the attacker unable to tell
    // a real id from a fabricated one.
    const read = await app.inject({
      method: 'GET', url: `${url}/${id}`, headers: bob.headers,
    });
    expect(read.statusCode).toBe(404);

    const update = await app.inject({
      method: 'PATCH', url: `${url}/${id}`, headers: bob.headers,
      payload: { title: 'Hijacked' },
    });
    expect(update.statusCode).toBe(404);

    const remove = await app.inject({
      method: 'DELETE', url: `${url}/${id}`, headers: bob.headers,
    });
    expect(remove.statusCode).toBe(404);

    // And the row is genuinely untouched.
    const still = await app.inject({
      method: 'GET', url: `${url}/${id}`, headers: alice.headers,
    });
    expect(still.json().title).toBe('Secret');
  });
});
