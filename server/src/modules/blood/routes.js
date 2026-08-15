import { z } from 'zod';

import { pageResponseSchema } from '../../lib/pagination.js';
import * as service from './service.js';
import {
  bloodRequestResponseSchema,
  createBloodRequestBodySchema,
  donorProfileResponseSchema,
  listBloodRequestsQuerySchema,
  updateBloodRequestBodySchema,
  updateDonorProfileBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });

export default async function bloodRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/donor-profile',
    { schema: { response: { 200: donorProfileResponseSchema } } },
    async (request) => service.getDonorProfile(app, request.user.sub),
  );

  app.put(
    '/donor-profile',
    {
      schema: {
        body: updateDonorProfileBodySchema,
        response: { 200: donorProfileResponseSchema },
      },
    },
    async (request) => service.updateDonorProfile(app, request.user.sub, request.body),
  );

  app.get(
    '/requests',
    {
      schema: {
        querystring: listBloodRequestsQuerySchema,
        response: { 200: pageResponseSchema(bloodRequestResponseSchema) },
      },
    },
    async (request) => service.listRequests(app, request.user.sub, request.query),
  );

  app.post(
    '/requests',
    {
      schema: {
        body: createBloodRequestBodySchema,
        response: { 201: bloodRequestResponseSchema },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return service.createRequest(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/requests/:id',
    {
      schema: {
        params: idParams,
        body: updateBloodRequestBodySchema,
        response: { 200: bloodRequestResponseSchema },
      },
    },
    async (request) =>
      service.updateRequestStatus(app, request.user.sub, request.params.id, request.body),
  );
}
