import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

/** Mirrors `TaskCategory` in the Flutter app's todo_list_screen.dart. */
export const taskCategorySchema = z.enum(['TODAY', 'LATER']);

export const taskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  note: z.string(),
  category: taskCategorySchema,
  dueDate: z.date().or(z.string()).nullable(),
  isDone: z.boolean(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const createTaskBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    note: z.string().trim().max(2000).default(''),
    category: taskCategorySchema.default('TODAY'),
    // Coerced because JSON has no date type; the client sends ISO-8601.
    dueDate: z.coerce.date().nullish(),
  })
  .strict();

/**
 * All fields optional, but at least one required — an empty PATCH is almost
 * always a client bug, and silently succeeding hides it.
 */
export const updateTaskBodySchema = createTaskBodySchema
  .partial()
  .extend({ isDone: z.boolean().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listTasksQuerySchema = paginationQuerySchema.extend({
  // Matches the app's TaskFilter enum (all | today | later | completed).
  filter: z.enum(['all', 'today', 'later', 'completed']).default('all'),
  search: z.string().trim().max(200).optional(),
});

export function toTaskResponse(task) {
  return {
    id: task.id,
    title: task.title,
    note: task.note,
    category: task.category,
    dueDate: task.dueDate,
    isDone: task.isDone,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
