import { z } from 'zod';

import { pageResponseSchema } from '../../lib/pagination.js';
import * as service from './service.js';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  taskResponseSchema,
  updateTaskBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });

export default async function taskRoutes(app) {
  // Applied once for the whole module rather than per route, so a new endpoint
  // cannot accidentally ship unauthenticated.
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/',
    {
      schema: {
        querystring: listTasksQuerySchema,
        response: { 200: pageResponseSchema(taskResponseSchema) },
      },
    },
    async (request) => service.listTasks(app, request.user.sub, request.query),
  );

  app.get(
    '/:id',
    { schema: { params: idParams, response: { 200: taskResponseSchema } } },
    async (request) => service.getTask(app, request.user.sub, request.params.id),
  );

  app.post(
    '/',
    { schema: { body: createTaskBodySchema, response: { 201: taskResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createTask(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        params: idParams,
        body: updateTaskBodySchema,
        response: { 200: taskResponseSchema },
      },
    },
    async (request) =>
      service.updateTask(app, request.user.sub, request.params.id, request.body),
  );

  app.delete(
    '/:id',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteTask(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );
}
