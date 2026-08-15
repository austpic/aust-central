import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.js';
import { booleanQuery } from '../../lib/validation.js';

/**
 * Blood groups cross the wire in the display form the app already uses ("A+"),
 * while the database stores an enum-safe form ("A_POS"). Translating at this
 * boundary keeps `+`/`-` out of enum identifiers without forcing the Flutter
 * client to learn a second vocabulary.
 */
const GROUP_TO_DB = Object.freeze({
  'A+': 'A_POS', 'A-': 'A_NEG',
  'B+': 'B_POS', 'B-': 'B_NEG',
  'O+': 'O_POS', 'O-': 'O_NEG',
  'AB+': 'AB_POS', 'AB-': 'AB_NEG',
});

const DB_TO_GROUP = Object.freeze(
  Object.fromEntries(Object.entries(GROUP_TO_DB).map(([k, v]) => [v, k])),
);

/** Order matches the campus donor form, as in the app's kBloodGroups. */
export const bloodGroupSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);

export const toDbGroup = (group) => (group == null ? null : GROUP_TO_DB[group]);
export const fromDbGroup = (group) => (group == null ? null : DB_TO_GROUP[group]);

export const urgencySchema = z.enum(['ROUTINE', 'URGENT', 'CRITICAL']);
export const requestStatusSchema = z.enum(['OPEN', 'FULFILLED', 'CANCELLED']);

// --- Donor profile ----------------------------------------------------------

export const donorProfileResponseSchema = z.object({
  available: z.boolean(),
  bloodGroup: bloodGroupSchema.nullable(),
  lastDonated: z.date().or(z.string()).nullable(),
  // Server-computed; the client renders these rather than deriving its own.
  eligible: z.boolean(),
  daysUntilEligible: z.number().int(),
  progress: z.number(),
  statusCopy: z.string(),
});

export const updateDonorProfileBodySchema = z
  .object({
    available: z.boolean().optional(),
    bloodGroup: bloodGroupSchema.nullish(),
    // Future donation dates are nonsense; the app clamps them client-side and
    // the server refuses them outright.
    lastDonated: z.coerce
      .date()
      .refine((d) => d <= new Date(), { message: 'Donation date cannot be in the future' })
      .nullish(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

// --- Requests ---------------------------------------------------------------

export const bloodRequestResponseSchema = z.object({
  id: z.string().uuid(),
  patientName: z.string(),
  bloodGroup: bloodGroupSchema,
  hospital: z.string(),
  location: z.string(),
  units: z.number().int(),
  urgency: urgencySchema,
  requiredBy: z.date().or(z.string()),
  contactNumber: z.string(),
  notes: z.string(),
  status: requestStatusSchema,
  createdAt: z.date().or(z.string()),
  requesterName: z.string().nullable(),
  isMine: z.boolean(),
});

export const createBloodRequestBodySchema = z
  .object({
    patientName: z.string().trim().min(1).max(160),
    bloodGroup: bloodGroupSchema,
    hospital: z.string().trim().min(1).max(200),
    location: z.string().trim().max(200).default(''),
    units: z.number().int().min(1).max(20),
    urgency: urgencySchema.default('ROUTINE'),
    requiredBy: z.coerce.date(),
    // Bangladeshi mobile numbers, with or without country code. Kept
    // deliberately loose — a rejected valid number costs a donor.
    contactNumber: z
      .string()
      .trim()
      .min(6)
      .max(24)
      .regex(/^[+\d][\d\s-]*$/, 'Enter a valid contact number'),
    notes: z.string().trim().max(1000).default(''),
  })
  .strict();

export const updateBloodRequestBodySchema = z
  .object({ status: requestStatusSchema })
  .strict();

export const listBloodRequestsQuerySchema = paginationQuerySchema.extend({
  bloodGroup: bloodGroupSchema.optional(),
  urgency: urgencySchema.optional(),
  status: requestStatusSchema.default('OPEN'),
  mine: booleanQuery(),
});
