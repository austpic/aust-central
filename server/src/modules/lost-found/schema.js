import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const lostFoundKindSchema = z.enum(['LOST', 'FOUND']);
export const lostFoundStatusSchema = z.enum(['OPEN', 'CLAIMED', 'RESOLVED']);

export const lostFoundResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: lostFoundKindSchema,
  category: z.string(),
  color: z.string(),
  room: z.string(),
  occurredOn: z.date().or(z.string()),
  description: z.string(),
  status: lostFoundStatusSchema,
  createdAt: z.date().or(z.string()),
  reporterName: z.string().nullable(),
  isMine: z.boolean(),
  imageIds: z.array(z.string().uuid()),
});

export const createLostFoundBodySchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    kind: lostFoundKindSchema,
    // Free text rather than an enum: the app's categories (Bags, Bottle, ID
    // Card, Umbrella, Charger) are a starting set, not a closed vocabulary.
    category: z.string().trim().min(1).max(60),
    color: z.string().trim().max(60).default(''),
    room: z.string().trim().max(60).default(''),
    occurredOn: z.coerce.date(),
    description: z.string().trim().max(2000).default(''),
    imageIds: z.array(z.string().uuid()).max(6).default([]),
  })
  .strict();

export const updateLostFoundBodySchema = createLostFoundBodySchema
  .partial()
  .extend({ status: lostFoundStatusSchema.optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

/**
 * Search and category filtering move here from lost_found_screen.dart, where
 * they ran over a hardcoded five-item list.
 */
export const listLostFoundQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(60).optional(),
  kind: lostFoundKindSchema.optional(),
  status: lostFoundStatusSchema.default('OPEN'),
  mine: z.coerce.boolean().default(false),
});

export function toLostFoundResponse(row, viewerId) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    category: row.category,
    color: row.color,
    room: row.room,
    occurredOn: row.occurredOn,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
    reporterName: row.reporter?.name ?? null,
    isMine: row.reporterId === viewerId,
    imageIds: (row.images ?? []).map((i) => i.fileId),
  };
}
