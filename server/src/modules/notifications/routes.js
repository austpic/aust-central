import { z } from 'zod';

import { notFoundOrForbidden } from '../../lib/errors.js';
import { pageResponseSchema, paginationQuerySchema, toPage, toPrismaPage } from '../../lib/pagination.js';

/**
 * Notifications. Gives notifications_screen.dart — currently a 19-line
 * placeholder — something real to render.
 *
 * Small enough that routes and logic live together rather than being split
 * across three files for four endpoints.
 */

const idParams = z.object({ id: z.string().uuid() });

const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'NOTICE', 'BLOOD_REQUEST', 'BOOK_MESSAGE', 'LOST_FOUND', 'CLASS_REMINDER', 'SYSTEM',
  ]),
  title: z.string(),
  body: z.string(),
  payload: z.any().nullable(),
  readAt: z.date().or(z.string()).nullable(),
  createdAt: z.date().or(z.string()),
});

const listQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
});

function toResponse(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    payload: row.payload ?? null,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export default async function notificationRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/',
    {
      schema: {
        querystring: listQuerySchema,
        response: { 200: pageResponseSchema(notificationResponseSchema) },
      },
    },
    async (request) => {
      const rows = await app.prisma.notification.findMany({
        where: {
          userId: request.user.sub,
          ...(request.query.unreadOnly ? { readAt: null } : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toPrismaPage(request.query),
      });
      const page = toPage(rows, request.query.limit);
      return { ...page, items: page.items.map(toResponse) };
    },
  );

  app.get(
    '/unread-count',
    { schema: { response: { 200: z.object({ count: z.number().int() }) } } },
    async (request) => ({
      count: await app.prisma.notification.count({
        where: { userId: request.user.sub, readAt: null },
      }),
    }),
  );

  app.post(
    '/:id/read',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      // Owner-scoped in the WHERE clause — marking someone else's notification
      // read is not a data leak, but it is still not yours to touch.
      const { count } = await app.prisma.notification.updateMany({
        where: { id: request.params.id, userId: request.user.sub, readAt: null },
        data: { readAt: new Date() },
      });
      if (count === 0) throw notFoundOrForbidden('Notification');
      reply.code(204);
      return null;
    },
  );

  app.post(
    '/read-all',
    { schema: { response: { 200: z.object({ updated: z.number().int() }) } } },
    async (request) => {
      const { count } = await app.prisma.notification.updateMany({
        where: { userId: request.user.sub, readAt: null },
        data: { readAt: new Date() },
      });
      return { updated: count };
    },
  );
}
