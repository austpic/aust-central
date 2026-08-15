import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';

/**
 * Lab report cover-page drafts.
 *
 * One field per TextEditingController in lab_report_screen.dart. Dates are kept
 * as free text, not DateTime: the form writes whatever the picker produced and
 * the value is only ever printed onto a PDF cover page, so parsing it would add
 * a failure mode without adding meaning.
 */
const fields = {
  courseNo: z.string().trim().max(40),
  courseName: z.string().trim().max(160),
  assignmentNo: z.string().trim().max(40),
  performanceDate: z.string().trim().max(40),
  submissionDate: z.string().trim().max(40),
  submittedTo: z.string().trim().max(160),
  studentName: z.string().trim().max(160),
  studentId: z.string().trim().max(40),
  group: z.string().trim().max(40),
  section: z.string().trim().max(40),
};

export const labReportResponseSchema = z.object({
  id: z.string().uuid(),
  ...Object.fromEntries(Object.keys(fields).map((k) => [k, z.string()])),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// Everything defaults to empty so a half-filled form can be saved as a draft.
export const createLabReportBodySchema = z
  .object(
    Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.default('')])),
  )
  .strict();

export const updateLabReportBodySchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

export const listLabReportsQuerySchema = paginationQuerySchema;

export function toLabReportResponse(row) {
  return {
    id: row.id,
    ...Object.fromEntries(Object.keys(fields).map((k) => [k, row[k]])),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
