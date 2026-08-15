import { z } from 'zod';

import { pageResponseSchema } from '../../lib/pagination.js';
import * as service from './service.js';
import {
  createNoticeBodySchema,
  listNoticesQuerySchema,
  noticeResponseSchema,
  updateNoticeBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });

export default async function noticeRoutes(app) {
  // Reads need a session but no special role.
  app.addHook('onRequest', app.requireAuth);

  // Writes are staff-only. Composed as a second hook so the role check runs
  // after authentication has populated request.user.
  const staffOnly = { onRequest: [app.requireAuth, app.requireRole('MODERATOR', 'ADMIN')] };

  app.get(
    '/',
    {
      schema: {
        querystring: listNoticesQuerySchema,
        response: { 200: pageResponseSchema(noticeResponseSchema) },
      },
    },
    async (request) => service.listNotices(app, request.query),
  );

  app.get(
    '/latest',
    { schema: { response: { 200: noticeResponseSchema.nullable() } } },
    async () => service.latestNotice(app),
  );

  app.get(
    '/:id',
    { schema: { params: idParams, response: { 200: noticeResponseSchema } } },
    async (request) => service.getNotice(app, request.params.id),
  );

  app.post(
    '/',
    { ...staffOnly, schema: { body: createNoticeBodySchema, response: { 201: noticeResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createNotice(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/:id',
    {
      ...staffOnly,
      schema: {
        params: idParams,
        body: updateNoticeBodySchema,
        response: { 200: noticeResponseSchema },
      },
    },
    async (request) => service.updateNotice(app, request.params.id, request.body),
  );

  app.delete(
    '/:id',
    { ...staffOnly, schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteNotice(app, request.params.id);
      reply.code(204);
      return null;
    },
  );
}
