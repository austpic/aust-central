import { z } from 'zod';

import * as service from './service.js';
import {
  cgpaSummaryResponseSchema,
  createCourseBodySchema,
  createSemesterBodySchema,
  semesterResponseSchema,
  updateCourseBodySchema,
  updateSemesterBodySchema,
  whatIfBodySchema,
  whatIfResponseSchema,
} from './schema.js';

const semesterParams = z.object({ id: z.string().uuid() });
const courseParams = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
});

export default async function cgpaRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/summary',
    { schema: { response: { 200: cgpaSummaryResponseSchema } } },
    async (request) => service.summary(app, request.user.sub),
  );

  app.post(
    '/what-if',
    { schema: { body: whatIfBodySchema, response: { 200: whatIfResponseSchema } } },
    async (request) => service.whatIf(app, request.user.sub, request.body),
  );

  app.get(
    '/semesters',
    { schema: { response: { 200: z.array(semesterResponseSchema) } } },
    async (request) => service.listSemesters(app, request.user.sub),
  );

  app.post(
    '/semesters',
    { schema: { body: createSemesterBodySchema, response: { 201: semesterResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createSemester(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/semesters/:id',
    {
      schema: {
        params: semesterParams,
        body: updateSemesterBodySchema,
        response: { 200: semesterResponseSchema },
      },
    },
    async (request) =>
      service.updateSemester(app, request.user.sub, request.params.id, request.body),
  );

  app.delete(
    '/semesters/:id',
    { schema: { params: semesterParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteSemester(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  app.post(
    '/semesters/:id/courses',
    {
      schema: {
        params: semesterParams,
        body: createCourseBodySchema,
        response: { 201: semesterResponseSchema },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return service.addCourse(app, request.user.sub, request.params.id, request.body);
    },
  );

  app.patch(
    '/semesters/:id/courses/:courseId',
    {
      schema: {
        params: courseParams,
        body: updateCourseBodySchema,
        response: { 200: semesterResponseSchema },
      },
    },
    async (request) =>
      service.updateCourse(
        app,
        request.user.sub,
        request.params.id,
        request.params.courseId,
        request.body,
      ),
  );

  app.delete(
    '/semesters/:id/courses/:courseId',
    { schema: { params: courseParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteCourse(
        app,
        request.user.sub,
        request.params.id,
        request.params.courseId,
      );
      reply.code(204);
      return null;
    },
  );
}
