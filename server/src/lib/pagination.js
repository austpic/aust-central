import { z } from 'zod';

import { BadRequestError } from './errors.js';

/**
 * Cursor pagination, shared by every list endpoint.
 *
 * Offset pagination (`?page=`) skips and shifts when rows are inserted mid-scroll
 * — bad for feeds like notices and messages that grow at the head. Cursors are
 * stable, and they keep an attacker from enumerating a table by walking offsets.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Query params every paginated route accepts. */
export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/**
 * Opaque cursors: clients must not build or reason about them, so we base64url
 * the id. This is obfuscation for API hygiene, NOT security — every query is
 * still scoped by the caller's user id.
 * @param {string} id
 */
export function encodeCursor(id) {
  return Buffer.from(String(id), 'utf8').toString('base64url');
}

/**
 * @param {string | undefined} cursor
 * @returns {string | undefined}
 */
export function decodeCursor(cursor) {
  if (!cursor) return undefined;
  const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
  if (!decoded) throw new BadRequestError('Malformed pagination cursor');
  return decoded;
}

/**
 * Build the Prisma arguments for a cursor page.
 *
 * Fetches one extra row to detect whether another page exists without a
 * second COUNT query.
 *
 * @param {{ cursor?: string, limit?: number }} query
 * @returns {{ take: number, skip?: number, cursor?: { id: string } }}
 */
export function toPrismaPage({ cursor, limit = DEFAULT_PAGE_SIZE }) {
  const decoded = decodeCursor(cursor);
  return {
    take: limit + 1,
    ...(decoded ? { cursor: { id: decoded }, skip: 1 } : {}),
  };
}

/**
 * Trim the probe row and derive the next cursor.
 *
 * @template T
 * @param {T[]} rows      Result of a query built with toPrismaPage.
 * @param {number} limit  The caller's requested page size.
 * @returns {{ items: T[], nextCursor: string | null, hasMore: boolean }}
 */
export function toPage(rows, limit = DEFAULT_PAGE_SIZE) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items,
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.id) : null,
  };
}

/** Response envelope shared by all list endpoints. */
export function pageResponseSchema(itemSchema) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });
}
