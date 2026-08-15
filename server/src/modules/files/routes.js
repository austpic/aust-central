import { z } from 'zod';

import { env } from '../../config/env.js';
import { BadRequestError } from '../../lib/errors.js';
import * as service from './service.js';

const idParams = z.object({ id: z.string().uuid() });

const fileResponseSchema = z.object({
  id: z.string().uuid(),
  mime: z.string(),
  sizeBytes: z.number().int(),
  originalName: z.string(),
  createdAt: z.date().or(z.string()),
});

export default async function fileRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.post(
    '/',
    {
      // Uploads are expensive (disk, hashing) so they get their own budget,
      // well below the global limit.
      config: {
        rateLimit: { max: 30, timeWindow: '15 minutes' },
      },
      schema: { response: { 201: fileResponseSchema } },
    },
    async (request, reply) => {
      if (!request.isMultipart()) {
        throw new BadRequestError('Expected a multipart/form-data upload');
      }

      // `file()` reads a single part; limits are enforced by @fastify/multipart
      // before the buffer is ever fully materialised.
      const part = await request.file();
      if (!part) throw new BadRequestError('No file was uploaded');

      const buffer = await part.toBuffer();

      // truncated is set when the stream hit the configured byte ceiling.
      if (part.file.truncated) {
        throw new BadRequestError('Upload exceeds the maximum allowed size');
      }

      const file = await service.storeUpload(app, request.user.sub, {
        buffer,
        filename: part.filename,
      });

      reply.code(201);
      return service.toFileResponse(file);
    },
  );

  app.get(
    '/:id',
    { schema: { params: idParams } },
    async (request, reply) => {
      const file = await service.getReadableFile(app, request.user.sub, request.params.id);

      // Serving user bytes is the one place this API hands back non-JSON, so
      // the headers matter:
      //   - nosniff stops a browser second-guessing the declared type
      //   - attachment prevents inline rendering, so even a mislabelled file
      //     cannot execute in the page's origin
      //   - the sandbox CSP neuters anything that does get rendered anyway
      reply
        .header('Content-Type', file.mime)
        .header('X-Content-Type-Options', 'nosniff')
        .header('Content-Security-Policy', "default-src 'none'; sandbox")
        .header('Content-Length', file.sizeBytes)
        .header(
          'Content-Disposition',
          // Filename is quoted and stripped of quotes/newlines so it cannot
          // break out of the header.
          `attachment; filename="${file.originalName.replace(/["\r\n]/g, '')}"`,
        )
        // Private: caches must not share one user's file with another.
        .header('Cache-Control', 'private, max-age=3600');

      return reply.send(service.openFileStream(file));
    },
  );

  app.delete(
    '/:id',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteFile(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  app.log.debug({ maxUploadBytes: env.MAX_UPLOAD_BYTES }, 'file routes registered');
}
