import { z } from 'zod';

import { pageResponseSchema } from '../../lib/pagination.js';
import * as service from './service.js';
import {
  createLostFoundBodySchema,
  listLostFoundQuerySchema,
  lostFoundResponseSchema,
  updateLostFoundBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });

export default async function lostFoundRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/',
    {
      schema: {
        querystring: listLostFoundQuerySchema,
        response: { 200: pageResponseSchema(lostFoundResponseSchema) },
      },
    },
    async (request) => service.listItems(app, request.user.sub, request.query),
  );

  app.get(
    '/categories',
    { schema: { response: { 200: z.array(z.string()) } } },
    async () => service.listCategories(app),
  );

  app.get(
    '/:id',
    { schema: { params: idParams, response: { 200: lostFoundResponseSchema } } },
    async (request) => service.getItem(app, request.user.sub, request.params.id),
  );

  app.post(
    '/',
    { schema: { body: createLostFoundBodySchema, response: { 201: lostFoundResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createItem(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        params: idParams,
        body: updateLostFoundBodySchema,
        response: { 200: lostFoundResponseSchema },
      },
    },
    async (request) =>
      service.updateItem(app, request.user.sub, request.params.id, request.body),
  );

  app.delete(
    '/:id',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteItem(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );
}
