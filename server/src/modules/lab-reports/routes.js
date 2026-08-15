import { z } from 'zod';

import { pageResponseSchema } from '../../lib/pagination.js';
import * as service from './service.js';
import {
  createLabReportBodySchema,
  labReportResponseSchema,
  listLabReportsQuerySchema,
  updateLabReportBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });

export default async function labReportRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/',
    {
      schema: {
        querystring: listLabReportsQuerySchema,
        response: { 200: pageResponseSchema(labReportResponseSchema) },
      },
    },
    async (request) => service.listDrafts(app, request.user.sub, request.query),
  );

  app.get(
    '/:id',
    { schema: { params: idParams, response: { 200: labReportResponseSchema } } },
    async (request) => service.getDraft(app, request.user.sub, request.params.id),
  );

  app.post(
    '/',
    { schema: { body: createLabReportBodySchema, response: { 201: labReportResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createDraft(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        params: idParams,
        body: updateLabReportBodySchema,
        response: { 200: labReportResponseSchema },
      },
    },
    async (request) =>
      service.updateDraft(app, request.user.sub, request.params.id, request.body),
  );

  app.delete(
    '/:id',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteDraft(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );
}
