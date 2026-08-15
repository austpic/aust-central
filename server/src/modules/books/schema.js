import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const bookConditionSchema = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']);
export const listingTypeSchema = z.enum(['SALE', 'SWAP', 'FREE']);
export const listingStatusSchema = z.enum(['ACTIVE', 'SOLD', 'REMOVED']);

export const listingResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  courseCode: z.string(),
  department: z.string(),
  semester: z.string(),
  condition: bookConditionSchema,
  listingType: listingTypeSchema,
  priceBdt: z.number().int().nullable(),
  description: z.string(),
  status: listingStatusSchema,
  createdAt: z.date().or(z.string()),
  imageIds: z.array(z.string().uuid()),
  seller: z.object({
    id: z.string().uuid(),
    name: z.string(),
    department: z.string().nullable(),
    // Null until the seller has been reviewed — the app's hardcoded "4.9"
    // becomes a real average, or honestly absent.
    rating: z.number().nullable(),
    reviewCount: z.number().int(),
  }),
  isMine: z.boolean(),
  isBookmarked: z.boolean(),
});

export const createListingBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    courseCode: z.string().trim().min(1).max(40),
    department: z.string().trim().min(1).max(120),
    semester: z.string().trim().min(1).max(60),
    condition: bookConditionSchema,
    listingType: listingTypeSchema,
    priceBdt: z.number().int().min(0).max(100_000).nullish(),
    description: z.string().trim().max(4000).default(''),
    imageIds: z.array(z.string().uuid()).max(6).default([]),
  })
  .strict()
  // Mirrors the database CHECK constraint, so the client gets a clear 422
  // instead of an opaque constraint violation.
  .refine((v) => (v.listingType === 'SALE' ? v.priceBdt != null : v.priceBdt == null), {
    message: 'A price is required for sale listings and must be omitted otherwise',
    path: ['priceBdt'],
  });

export const updateListingBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    courseCode: z.string().trim().min(1).max(40).optional(),
    department: z.string().trim().min(1).max(120).optional(),
    semester: z.string().trim().min(1).max(60).optional(),
    condition: bookConditionSchema.optional(),
    listingType: listingTypeSchema.optional(),
    priceBdt: z.number().int().min(0).max(100_000).nullish(),
    description: z.string().trim().max(4000).optional(),
    status: listingStatusSchema.optional(),
    imageIds: z.array(z.string().uuid()).max(6).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

export const listListingsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  department: z.string().trim().max(120).optional(),
  courseCode: z.string().trim().max(40).optional(),
  semester: z.string().trim().max(60).optional(),
  listingType: listingTypeSchema.optional(),
  // Matches the browse screen's filter row.
  sort: z.enum(['recent', 'department', 'courseCode', 'semester', 'freeFirst']).default('recent'),
  // Tabs: browse | mine | saved
  tab: z.enum(['browse', 'mine', 'saved']).default('browse'),
});

// --- Conversations & messages ----------------------------------------------

export const messageResponseSchema = z.object({
  id: z.string().uuid(),
  body: z.string(),
  senderId: z.string().uuid(),
  isMine: z.boolean(),
  readAt: z.date().or(z.string()).nullable(),
  createdAt: z.date().or(z.string()),
});

export const conversationResponseSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid().nullable(),
  listingTitle: z.string().nullable(),
  counterparty: z.object({
    id: z.string().uuid(),
    name: z.string(),
    department: z.string().nullable(),
  }),
  lastMessageAt: z.date().or(z.string()),
  unreadCount: z.number().int(),
});

export const startConversationBodySchema = z
  .object({ listingId: z.string().uuid() })
  .strict();

export const sendMessageBodySchema = z
  .object({ body: z.string().trim().min(1).max(4000) })
  .strict();

// --- Reviews ---------------------------------------------------------------

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int(),
  comment: z.string(),
  raterName: z.string(),
  createdAt: z.date().or(z.string()),
});

export const createReviewBodySchema = z
  .object({
    listingId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).default(''),
  })
  .strict();
