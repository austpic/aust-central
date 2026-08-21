import { z } from 'zod';

import { env } from '../../config/env.js';

/**
 * Request and response contracts for the auth surface.
 *
 * These schemas are the app's real input boundary — on plain JavaScript there
 * is nothing else between a POST body and a database write.
 */

/**
 * Emails are lowercased and trimmed at the edge so that "A@x.com" and
 * "a@x.com" cannot become two accounts. Storage assumes this has happened.
 *
 * The domain check applies everywhere this schema is used — register, login,
 * forgot-password, resend-verification — not just at signup. Only an
 * `@ALLOWED_EMAIL_DOMAIN` address is a valid AUST Central account at all, full
 * stop; there is no grandfathering for accounts created under a looser policy.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  // Generous but bounded: unbounded strings are a cheap way to make us hash,
  // index, and log megabytes.
  .max(254)
  .refine(
    (value) => !env.ALLOWED_EMAIL_DOMAIN || value.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`),
    { message: `Only @${env.ALLOWED_EMAIL_DOMAIN} email addresses are accepted` },
  );

/**
 * Password policy.
 *
 * Length does more for entropy than composition rules do, so the floor is 10
 * (configurable upward) with a mixed-character requirement rather than the
 * app's current 6-character minimum. The 72-byte cap is a real constraint of
 * the hashing family — longer inputs are silently truncated by some
 * implementations, which would make the extra characters security theatre.
 */
export const passwordSchema = z
  .string()
  .min(env.PASSWORD_MIN_LENGTH, `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`)
  .max(72, 'Password must be at most 72 characters')
  .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value), {
    message: 'Password must contain both upper and lower case letters',
  })
  .refine((value) => /\d/.test(value), {
    message: 'Password must contain at least one number',
  });

export const nameSchema = z.string().trim().min(2, 'Name is required').max(120);

/**
 * A 6-digit numeric code from the verification / reset emails.
 *
 * Exactly six digits and nothing else: the code is compared as a hash server
 * side, and the shape here is what keeps that comparison bounded.
 */
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

// --- Requests ---------------------------------------------------------------

export const registerBodySchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    studentId: z.string().trim().max(40).optional(),
    department: z.string().trim().max(120).optional(),
  })
  // Unknown keys are dropped, so a client cannot smuggle `role: "ADMIN"`
  // into the create call through mass assignment.
  .strict();

export const loginBodySchema = z
  .object({
    email: emailSchema,
    // Not `passwordSchema`: an existing password predating a *password*
    // policy change must still be accepted at login, or we lock people out
    // of their accounts. The email domain restriction is different — it is
    // not a strength policy that only new signups need to meet, it is which
    // accounts are allowed to exist at all.
    password: z.string().min(1, 'Password is required').max(72),
  })
  .strict();

export const refreshBodySchema = z
  .object({
    // Optional in the body because mobile clients send it here while web
    // clients rely on the httpOnly cookie.
    refreshToken: z.string().min(1).max(200).optional(),
  })
  .strict();

export const forgotPasswordBodySchema = z.object({ email: emailSchema }).strict();

export const resetPasswordBodySchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
  })
  .strict();

export const verifyEmailBodySchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
  })
  .strict();

export const resendVerificationBodySchema = z.object({ email: emailSchema }).strict();

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });

// --- Responses --------------------------------------------------------------

/**
 * The public shape of a user.
 *
 * This is an allowlist, not a convenience: the serializer strips anything not
 * named here, so `passwordHash`, `failedLoginCount`, and `lockedUntil` cannot
 * reach a client even if a service hands back a whole Prisma row.
 */
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  studentId: z.string().nullable(),
  department: z.string().nullable(),
  role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN']),
  emailVerified: z.boolean(),
  avatarFileId: z.string().uuid().nullable(),
  createdAt: z.date().or(z.string()),
});

export const sessionResponseSchema = z.object({
  user: publicUserSchema,
  accessToken: z.string(),
  // Also set as an httpOnly cookie; returned in the body for mobile clients,
  // which have no cookie jar and store it in the OS keychain instead.
  refreshToken: z.string(),
  expiresIn: z.number().int(),
});

export const messageResponseSchema = z.object({ message: z.string() });

/** Map a Prisma user row onto the public shape. */
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    studentId: user.studentId ?? null,
    department: user.department ?? null,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    avatarFileId: user.avatarFileId ?? null,
    createdAt: user.createdAt,
  };
}
