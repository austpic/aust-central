import { z } from 'zod';

import * as service from './service.js';
import {
  classReminderResponseSchema,
  createAssessmentBodySchema,
  createReminderBodySchema,
  updateReminderBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });
const assessmentParams = z.object({
  id: z.string().uuid(),
  assessmentId: z.string().uuid(),
});

export default async function classReminderRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/',
    { schema: { response: { 200: z.array(classReminderResponseSchema) } } },
    async (request) => service.listReminders(app, request.user.sub),
  );

  // Declared before '/:id' so "next" is not captured as an id parameter.
  app.get(
    '/next',
    { schema: { response: { 200: classReminderResponseSchema.extend({ minutesUntil: z.number() }).nullable() } } },
    async (request) => service.nextClass(app, request.user.sub),
  );

  app.get(
    '/:id',
    { schema: { params: idParams, response: { 200: classReminderResponseSchema } } },
    async (request) => service.getReminder(app, request.user.sub, request.params.id),
  );

  app.post(
    '/',
    { schema: { body: createReminderBodySchema, response: { 201: classReminderResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createReminder(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        params: idParams,
        body: updateReminderBodySchema,
        response: { 200: classReminderResponseSchema },
      },
    },
    async (request) =>
      service.updateReminder(app, request.user.sub, request.params.id, request.body),
  );

  app.delete(
    '/:id',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteReminder(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  app.post(
    '/:id/assessments',
    {
      schema: {
        params: idParams,
        body: createAssessmentBodySchema,
        response: { 201: classReminderResponseSchema },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return service.addAssessment(app, request.user.sub, request.params.id, request.body);
    },
  );

  app.delete(
    '/:id/assessments/:assessmentId',
    { schema: { params: assessmentParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteAssessment(
        app,
        request.user.sub,
        request.params.id,
        request.params.assessmentId,
      );
      reply.code(204);
      return null;
    },
  );
}
