import { z } from 'zod';

import { pageResponseSchema, paginationQuerySchema } from '../../lib/pagination.js';
import * as service from './service.js';
import {
  conversationResponseSchema,
  createListingBodySchema,
  createReviewBodySchema,
  listListingsQuerySchema,
  listingResponseSchema,
  messageResponseSchema,
  reviewResponseSchema,
  sendMessageBodySchema,
  startConversationBodySchema,
  updateListingBodySchema,
} from './schema.js';

const idParams = z.object({ id: z.string().uuid() });

export default async function bookRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  // --- Listings ---
  app.get(
    '/listings',
    {
      schema: {
        querystring: listListingsQuerySchema,
        response: { 200: pageResponseSchema(listingResponseSchema) },
      },
    },
    async (request) => service.listListings(app, request.user.sub, request.query),
  );

  app.get(
    '/listings/:id',
    { schema: { params: idParams, response: { 200: listingResponseSchema } } },
    async (request) => service.getListing(app, request.user.sub, request.params.id),
  );

  app.post(
    '/listings',
    { schema: { body: createListingBodySchema, response: { 201: listingResponseSchema } } },
    async (request, reply) => {
      reply.code(201);
      return service.createListing(app, request.user.sub, request.body);
    },
  );

  app.patch(
    '/listings/:id',
    {
      schema: {
        params: idParams,
        body: updateListingBodySchema,
        response: { 200: listingResponseSchema },
      },
    },
    async (request) =>
      service.updateListing(app, request.user.sub, request.params.id, request.body),
  );

  app.delete(
    '/listings/:id',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.deleteListing(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  // --- Bookmarks ---
  app.put(
    '/listings/:id/bookmark',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.addBookmark(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  app.delete(
    '/listings/:id/bookmark',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.removeBookmark(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  // --- Conversations ---
  app.get(
    '/conversations',
    {
      schema: {
        querystring: paginationQuerySchema,
        response: { 200: pageResponseSchema(conversationResponseSchema) },
      },
    },
    async (request) => service.listConversations(app, request.user.sub, request.query),
  );

  app.post(
    '/conversations',
    {
      schema: {
        body: startConversationBodySchema,
        response: { 201: conversationResponseSchema },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return service.startConversation(app, request.user.sub, request.body);
    },
  );

  app.get(
    '/conversations/:id/messages',
    {
      schema: {
        params: idParams,
        querystring: paginationQuerySchema,
        response: { 200: pageResponseSchema(messageResponseSchema) },
      },
    },
    async (request) =>
      service.listMessages(app, request.user.sub, request.params.id, request.query),
  );

  app.post(
    '/conversations/:id/messages',
    {
      // Chat is the one high-frequency write path; this stops a script
      // flooding a thread without getting in a real conversation's way.
      config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
      schema: {
        params: idParams,
        body: sendMessageBodySchema,
        response: { 201: messageResponseSchema },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return service.sendMessage(app, request.user.sub, request.params.id, request.body);
    },
  );

  app.post(
    '/conversations/:id/read',
    { schema: { params: idParams, response: { 204: z.null() } } },
    async (request, reply) => {
      await service.markConversationRead(app, request.user.sub, request.params.id);
      reply.code(204);
      return null;
    },
  );

  // --- Reviews ---
  app.get(
    '/sellers/:id/reviews',
    {
      schema: {
        params: idParams,
        querystring: paginationQuerySchema,
        response: { 200: pageResponseSchema(reviewResponseSchema) },
      },
    },
    async (request) => service.listSellerReviews(app, request.params.id, request.query),
  );

  app.post(
    '/sellers/:id/reviews',
    {
      schema: {
        params: idParams,
        body: createReviewBodySchema,
        response: { 201: reviewResponseSchema },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return service.createReview(app, request.user.sub, request.params.id, request.body);
    },
  );
}
