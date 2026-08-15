import { z } from 'zod';

export const weekdaySchema = z.enum([
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);

export const assessmentTypeSchema = z.enum(['QUIZ', 'MID', 'LAB']);

/**
 * Wall-clock campus time, 24-hour. The same pattern is enforced by a CHECK
 * constraint in the database, so a bad value cannot arrive by any other route.
 */
export const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm 24-hour format');

export const assessmentResponseSchema = z.object({
  id: z.string().uuid(),
  type: assessmentTypeSchema,
  dateTime: z.date().or(z.string()),
});

export const classReminderResponseSchema = z.object({
  id: z.string().uuid(),
  courseName: z.string(),
  weekday: weekdaySchema,
  classTime: z.string(),
  isEnabled: z.boolean(),
  minutesBefore: z.number().int(),
  assessments: z.array(assessmentResponseSchema),
  createdAt: z.date().or(z.string()),
});

export const createReminderBodySchema = z
  .object({
    courseName: z.string().trim().min(1).max(160),
    weekday: weekdaySchema,
    classTime: clockTimeSchema,
    isEnabled: z.boolean().default(true),
    minutesBefore: z.number().int().min(0).max(1440).default(10),
  })
  .strict();

export const updateReminderBodySchema = createReminderBodySchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const createAssessmentBodySchema = z
  .object({
    type: assessmentTypeSchema,
    dateTime: z.coerce.date(),
  })
  .strict();

export function toReminderResponse(row) {
  return {
    id: row.id,
    courseName: row.courseName,
    weekday: row.weekday,
    classTime: row.classTime,
    isEnabled: row.isEnabled,
    minutesBefore: row.minutesBefore,
    assessments: (row.assessments ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      dateTime: a.dateTime,
    })),
    createdAt: row.createdAt,
  };
}
