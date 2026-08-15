import { z } from 'zod';

export const weekdaySchema = z.enum([
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
]);

export const stopResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const busResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  driverName: z.string().nullable(),
  driverNumber: z.string(),
  route: z.array(stopResponseSchema),
});

export const departureResponseSchema = z.object({
  id: z.string().uuid(),
  departureTime: z.string(),
  daysOfWeek: z.array(weekdaySchema),
  bus: busResponseSchema,
});

/**
 * Departure search. `from`/`to` are stop ids; the service only returns buses
 * whose route visits `from` before `to`, since direction matters on a loop.
 */
export const searchDeparturesQuerySchema = z.object({
  from: z.string().uuid().optional(),
  to: z.string().uuid().optional(),
  // ISO date (no time). Defaults to today.
  date: z.coerce.date().optional(),
});

