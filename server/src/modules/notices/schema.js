import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

export const noticeCategorySchema = z.enum(['ACADEMIC', 'EXAM', 'EVENT', 'GENERAL']);

export const noticeResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  category: noticeCategorySchema,
  pinned: z.boolean(),
  postedAt: z.date().or(z.string()),
  // Name only — the author's email and id are staff PII and are not part of
  // what a student needs to read a notice.
  authorName: z.string().nullable(),
});

export const createNoticeBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(8000),
    category: noticeCategorySchema.default('GENERAL'),
    pinned: z.boolean().default(false),
    postedAt: z.coerce.date().optional(),
  })
  .strict();

export const updateNoticeBodySchema = createNoticeBodySchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

export const listNoticesQuerySchema = paginationQuerySchema.extend({
  category: noticeCategorySchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export function toNoticeResponse(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    pinned: row.pinned,
    postedAt: row.postedAt,
    authorName: row.author?.name ?? null,
  };
}
