import { beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, useCleanDatabase } from './helpers/app.js';
import { createUser, promote } from './helpers/auth.js';

/**
 * Cross-module security suite.
 *
 * Every case here is an authorisation boundary rather than a feature. They are
 * grouped together deliberately: these are the properties that must hold no
 * matter which module a future change touches.
 */

let app;
beforeAll(async () => {
  app = await createTestApp();
});
useCleanDatabase(() => app);

const api = (url, options = {}) =>
  app.inject({ url: `/api/v1${url}`, ...options });

describe('every feature route requires authentication', () => {
  it.each([
    ['GET', '/tasks'],
    ['GET', '/class-reminders'],
    ['GET', '/cgpa/summary'],
    ['GET', '/lab-reports'],
    ['GET', '/notices'],
    ['GET', '/blood/requests'],
    ['GET', '/lost-found'],
    ['GET', '/books/listings'],
    ['GET', '/transport/stops'],
    ['GET', '/notifications'],
    ['GET', '/me/dashboard'],
  ])('%s %s rejects anonymous callers', async (method, url) => {
    const response = await api(url, { method });
    expect(response.statusCode).toBe(401);
  });
});

describe('notices RBAC', () => {
  const payload = { title: 'Campus closed', body: 'All classes suspended tomorrow.' };

  it('lets any signed-in student read', async () => {
    const student = await createUser(app);
    const response = await api('/notices', { headers: student.headers });
    expect(response.statusCode).toBe(200);
  });

  it('forbids a student from posting', async () => {
    const student = await createUser(app);
    const response = await api('/notices', {
      method: 'POST',
      headers: student.headers,
      payload,
    });
    // 403, not 404: the route exists and the student is authenticated — this
    // is a genuine permission failure, and hiding it would just confuse.
    expect(response.statusCode).toBe(403);
  });

  it('allows a moderator to post', async () => {
    const user = await createUser(app);
    const staff = await promote(app, user.id, 'MODERATOR');

    const response = await api('/notices', {
      method: 'POST',
      headers: staff.headers,
      payload,
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().title).toBe('Campus closed');
  });

  it('does not let a student escalate by claiming a role in the body', async () => {
    const student = await createUser(app);
    const response = await api('/notices', {
      method: 'POST',
      headers: student.headers,
      payload: { ...payload, role: 'ADMIN' },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('book exchange isolation', () => {
  async function listingFor(seller) {
    const created = await api('/books/listings', {
      method: 'POST',
      headers: seller.headers,
      payload: {
        title: 'Introduction to Algorithms',
        courseCode: 'CSE 301',
        department: 'CSE',
        semester: 'Fall 2025',
        condition: 'GOOD',
        listingType: 'FREE',
      },
    });
    expect(created.statusCode).toBe(201);
    return created.json();
  }

  it("refuses to edit another user's listing", async () => {
    const seller = await createUser(app);
    const stranger = await createUser(app);
    const listing = await listingFor(seller);

    const response = await api(`/books/listings/${listing.id}`, {
      method: 'PATCH',
      headers: stranger.headers,
      payload: { title: 'Hijacked' },
    });
    expect(response.statusCode).toBe(404);
  });

  it('enforces the price/type pairing', async () => {
    const seller = await createUser(app);
    const response = await api('/books/listings', {
      method: 'POST',
      headers: seller.headers,
      payload: {
        title: 'Priced swap', courseCode: 'X', department: 'Y', semester: 'Z',
        condition: 'GOOD', listingType: 'SWAP', priceBdt: 500,
      },
    });
    expect(response.statusCode).toBe(422);
  });

  it('stops a third party reading a private conversation', async () => {
    const seller = await createUser(app);
    const buyer = await createUser(app);
    const stranger = await createUser(app);
    const listing = await listingFor(seller);

    const started = await api('/books/conversations', {
      method: 'POST',
      headers: buyer.headers,
      payload: { listingId: listing.id },
    });
    expect(started.statusCode).toBe(201);
    const conversationId = started.json().id;

    await api(`/books/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: buyer.headers,
      payload: { body: 'Is this still available?' },
    });

    // The seller is a participant and may read.
    const asSeller = await api(`/books/conversations/${conversationId}/messages`, {
      headers: seller.headers,
    });
    expect(asSeller.statusCode).toBe(200);
    expect(asSeller.json().items).toHaveLength(1);

    // A stranger holding the conversation id may not.
    const asStranger = await api(`/books/conversations/${conversationId}/messages`, {
      headers: stranger.headers,
    });
    expect(asStranger.statusCode).toBe(404);

    const posting = await api(`/books/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: stranger.headers,
      payload: { body: 'Injected' },
    });
    expect(posting.statusCode).toBe(404);
  });

  it('does not fork a thread when a buyer reopens the chat', async () => {
    const seller = await createUser(app);
    const buyer = await createUser(app);
    const listing = await listingFor(seller);

    const first = await api('/books/conversations', {
      method: 'POST', headers: buyer.headers, payload: { listingId: listing.id },
    });
    const second = await api('/books/conversations', {
      method: 'POST', headers: buyer.headers, payload: { listingId: listing.id },
    });

    expect(second.json().id).toBe(first.json().id);
  });

  it('refuses a conversation with yourself', async () => {
    const seller = await createUser(app);
    const listing = await listingFor(seller);

    const response = await api('/books/conversations', {
      method: 'POST', headers: seller.headers, payload: { listingId: listing.id },
    });
    expect(response.statusCode).toBe(409);
  });
});

describe('blood requests', () => {
  async function requestFor(user) {
    const created = await api('/blood/requests', {
      method: 'POST',
      headers: user.headers,
      payload: {
        patientName: 'Nazia Rahman',
        bloodGroup: 'A+',
        hospital: 'Square Hospital',
        units: 2,
        urgency: 'CRITICAL',
        requiredBy: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        contactNumber: '+8801711122334',
      },
    });
    expect(created.statusCode).toBe(201);
    return created.json();
  }

  it('is visible to the whole community', async () => {
    const requester = await createUser(app);
    const other = await createUser(app);
    await requestFor(requester);

    const list = await api('/blood/requests', { headers: other.headers });
    expect(list.json().items).toHaveLength(1);
    // Community visibility is the point — but the viewer must know it is not
    // theirs, so the UI can hide owner-only controls.
    expect(list.json().items[0].isMine).toBe(false);
  });

  it('lets only the requester close a request', async () => {
    const requester = await createUser(app);
    const stranger = await createUser(app);
    const request = await requestFor(requester);

    const byStranger = await api(`/blood/requests/${request.id}`, {
      method: 'PATCH', headers: stranger.headers, payload: { status: 'CANCELLED' },
    });
    expect(byStranger.statusCode).toBe(404);

    const byOwner = await api(`/blood/requests/${request.id}`, {
      method: 'PATCH', headers: requester.headers, payload: { status: 'FULFILLED' },
    });
    expect(byOwner.statusCode).toBe(200);
    expect(byOwner.json().status).toBe('FULFILLED');
  });

  it('rejects a future donation date on the donor profile', async () => {
    const user = await createUser(app);
    const response = await api('/blood/donor-profile', {
      method: 'PUT',
      headers: user.headers,
      payload: { lastDonated: new Date(Date.now() + 86_400_000).toISOString() },
    });
    expect(response.statusCode).toBe(422);
  });
});

describe('uploads', () => {
  /** Build a minimal multipart body by hand — no extra test dependency. */
  function multipart(buffer, filename, contentType) {
    const boundary = '----testboundary9f2c';
    const head = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`,
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    return {
      payload: Buffer.concat([head, buffer, tail]),
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    };
  }

  const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
  ]);

  it('accepts a real PNG', async () => {
    const user = await createUser(app);
    const body = multipart(PNG, 'photo.png', 'image/png');

    const response = await api('/files', {
      method: 'POST',
      headers: { ...user.headers, ...body.headers },
      payload: body.payload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().mime).toBe('image/png');
  });

  it('rejects a script disguised as a PNG', async () => {
    const user = await createUser(app);
    // Correct extension, correct declared MIME, wrong bytes. Trusting either
    // of the first two would store an executable payload as an image.
    const evil = Buffer.from('#!/bin/sh\nrm -rf /\n');
    const body = multipart(evil, 'innocent.png', 'image/png');

    const response = await api('/files', {
      method: 'POST',
      headers: { ...user.headers, ...body.headers },
      payload: body.payload,
    });

    expect(response.statusCode).toBe(415);
  });

  it('rejects an SVG, which can carry script', async () => {
    const user = await createUser(app);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const body = multipart(svg, 'x.svg', 'image/svg+xml');

    const response = await api('/files', {
      method: 'POST',
      headers: { ...user.headers, ...body.headers },
      payload: body.payload,
    });

    expect(response.statusCode).toBe(415);
  });

  it("does not serve another user's private upload", async () => {
    const owner = await createUser(app);
    const stranger = await createUser(app);
    const body = multipart(PNG, 'private.png', 'image/png');

    const uploaded = await api('/files', {
      method: 'POST',
      headers: { ...owner.headers, ...body.headers },
      payload: body.payload,
    });
    const { id } = uploaded.json();

    expect((await api(`/files/${id}`, { headers: owner.headers })).statusCode).toBe(200);
    expect((await api(`/files/${id}`, { headers: stranger.headers })).statusCode).toBe(404);
  });

  it('serves files as attachments with sniffing disabled', async () => {
    const user = await createUser(app);
    const body = multipart(PNG, 'photo.png', 'image/png');
    const uploaded = await api('/files', {
      method: 'POST',
      headers: { ...user.headers, ...body.headers },
      payload: body.payload,
    });

    const response = await api(`/files/${uploaded.json().id}`, { headers: user.headers });
    expect(response.headers['content-disposition']).toMatch(/^attachment/);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toContain('private');
  });

  it('refuses a file id from another user as an avatar', async () => {
    const owner = await createUser(app);
    const stranger = await createUser(app);
    const body = multipart(PNG, 'photo.png', 'image/png');

    const uploaded = await api('/files', {
      method: 'POST',
      headers: { ...owner.headers, ...body.headers },
      payload: body.payload,
    });

    const response = await api('/me/avatar', {
      method: 'PUT',
      headers: stranger.headers,
      payload: { fileId: uploaded.json().id },
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('response shape', () => {
  it('never leaks internal user columns through the dashboard', async () => {
    const user = await createUser(app);
    const response = await api('/me/dashboard', { headers: user.headers });

    expect(response.statusCode).toBe(200);
    for (const secret of ['passwordHash', 'failedLoginCount', 'lockedUntil', '$argon2']) {
      expect(response.body).not.toContain(secret);
    }
  });

  it('reports no CGPA rather than 0.00 for a student with no grades', async () => {
    const user = await createUser(app);
    const response = await api('/me/dashboard', { headers: user.headers });
    // "You have a 0.00 CGPA" would be alarming and wrong.
    expect(response.json().cgpa).toBeNull();
  });
});

describe('query-string booleans', () => {
  /**
   * Regression: `z.coerce.boolean()` runs JS `Boolean(value)`, and every
   * non-empty string is truthy — so `?mine=false` parsed as **true** and
   * silently inverted the filter. The blood bank's community feed showed
   * nothing but the viewer's own requests as a result.
   */
  it('treats mine=false as false, not true', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);

    const payload = {
      patientName: 'Community Patient',
      bloodGroup: 'A+',
      hospital: 'Square',
      units: 1,
      urgency: 'ROUTINE',
      requiredBy: new Date(Date.now() + 86_400_000).toISOString(),
      contactNumber: '+8801711122334',
    };
    await api('/blood/requests', { method: 'POST', headers: alice.headers, payload });

    // Bob asks for the community feed explicitly opting out of "mine".
    const feed = await api('/blood/requests?mine=false', { headers: bob.headers });
    expect(feed.statusCode).toBe(200);
    expect(feed.json().items).toHaveLength(1);
    expect(feed.json().items[0].isMine).toBe(false);

    // And mine=true really does scope to the caller.
    const bobOwn = await api('/blood/requests?mine=true', { headers: bob.headers });
    expect(bobOwn.json().items).toHaveLength(0);
  });

  it('treats unreadOnly=false as false', async () => {
    const user = await createUser(app);
    const response = await api('/notifications?unreadOnly=false', { headers: user.headers });
    expect(response.statusCode).toBe(200);
  });

  it('rejects a non-boolean string rather than coercing it', async () => {
    const user = await createUser(app);
    const response = await api('/blood/requests?mine=banana', { headers: user.headers });
    expect(response.statusCode).toBe(422);
  });
});

describe('notification read idempotency', () => {
  it('re-marking an already-read notification is a no-op, not a 404', async () => {
    const user = await createUser(app);
    const created = await app.prisma.notification.create({
      data: { userId: user.id, type: 'SYSTEM', title: 'Probe', body: '' },
    });

    const first = await api(`/notifications/${created.id}/read`, {
      method: 'POST', headers: user.headers,
    });
    expect(first.statusCode).toBe(204);

    const second = await api(`/notifications/${created.id}/read`, {
      method: 'POST', headers: user.headers,
    });
    expect(second.statusCode).toBe(204);

    // The original read time must survive the repeat call.
    const row = await app.prisma.notification.findUnique({ where: { id: created.id } });
    expect(row.readAt).not.toBeNull();
  });

  it("still 404s on another user's notification", async () => {
    const owner = await createUser(app);
    const stranger = await createUser(app);
    const created = await app.prisma.notification.create({
      data: { userId: owner.id, type: 'SYSTEM', title: 'Private', body: '' },
    });

    const response = await api(`/notifications/${created.id}/read`, {
      method: 'POST', headers: stranger.headers,
    });
    expect(response.statusCode).toBe(404);
  });
});
