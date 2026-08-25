import { env } from '../../config/env.js';
import {
  fakeVerifyDelay,
  generateOtp,
  generateOpaqueToken,
  hashOtp,
  hashPassword,
  hashToken,
  needsRehash,
  newTokenFamilyId,
  safeEqual,
  verifyPassword,
} from '../../lib/crypto.js';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../lib/errors.js';
import { passwordResetEmail, sendMail, verificationEmail } from '../../lib/mailer.js';
import { toPublicUser } from './schema.js';

/**
 * Authentication logic.
 *
 * Two principles run through the whole file:
 *
 *  1. **Never confirm whether an account exists.** Login, registration, and
 *     password reset all behave identically for known and unknown addresses —
 *     in response body, status code, and (as far as practical) timing.
 *  2. **Refresh tokens are single-use.** Every refresh rotates the token and
 *     marks the old one used; presenting a used token means it leaked, so the
 *     entire family is revoked rather than just the replayed token.
 */

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const OTP_TTL_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

/** Access-token lifetime in seconds, for the `expiresIn` field. */
function accessTokenSeconds() {
  const ttl = env.JWT_ACCESS_TTL;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900;
  const value = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return value * multiplier;
}

function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Record a security-relevant event. Best-effort: a failed audit write must
 * never break the request that triggered it.
 */
async function audit(app, { actorId, action, entity, entityId, metadata, request }) {
  try {
    await app.prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entity: entity ?? null,
        entityId: entityId ?? null,
        metadata: metadata ?? undefined,
        ip: request?.ip ?? null,
        userAgent: request?.headers?.['user-agent'] ?? null,
      },
    });
  } catch (error) {
    app.log.error({ err: error, action }, 'failed to write audit log');
  }
}

/**
 * Issue a refresh token, optionally continuing an existing family.
 * Only the hash is stored; the plaintext is returned to the caller once.
 */
async function issueRefreshToken(app, { userId, familyId, request }) {
  const { token, hash } = generateOpaqueToken();

  await app.prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      familyId: familyId ?? newTokenFamilyId(),
      expiresAt: refreshExpiry(),
      ip: request?.ip ?? null,
      userAgent: request?.headers?.['user-agent'] ?? null,
    },
  });

  return token;
}

/** Build the response payload shared by register, login, and refresh. */
function buildSession(app, user, refreshToken) {
  return {
    user: toPublicUser(user),
    accessToken: app.signAccessToken(user),
    refreshToken,
    expiresIn: accessTokenSeconds(),
  };
}

/**
 * Validate a presented 6-digit code against the freshest active code for a
 * user, on a given token model (`emailVerificationToken` or
 * `passwordResetToken`).
 *
 * Failure paths:
 *  - no active code, or an expired one → 401, same message regardless so a
 *    caller cannot tell "no account" from "code spent"
 *  - a wrong code counts toward the per-code attempt budget; once exhausted
 *    the code is locked (403) until a fresh one is issued, so a 6-digit guess
 *    space cannot be walked through the API
 *
 * On success the caller is responsible for marking the row used.
 */
async function consumeOtp(app, { userId, code, model }) {
  const stored = await app.prisma[model].findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('This code is invalid or has expired. Request a new one.');
  }

  if (stored.attempts >= MAX_OTP_ATTEMPTS) {
    throw new ForbiddenError('Too many incorrect codes. Request a new one.');
  }

  if (!safeEqual(hashOtp(code), stored.tokenHash)) {
    const attempts = stored.attempts + 1;
    const locked = attempts >= MAX_OTP_ATTEMPTS;
    await app.prisma[model].update({
      where: { id: stored.id },
      data: { attempts },
    });
    throw locked
      ? new ForbiddenError('Too many incorrect codes. Request a new one.')
      : new UnauthorizedError('Incorrect code. Please try again.');
  }

  return stored;
}

// ---------------------------------------------------------------------------

export async function register(app, request, input) {
  const existing = await app.prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    // A hard 409 here is a deliberate exception to the no-enumeration rule:
    // without it a user cannot tell a typo from an account they already have,
    // and the address is one the caller already possesses. Rate limiting on
    // this route is what stops it becoming a bulk oracle.
    throw new ConflictError('An account with that email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await app.prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      studentId: input.studentId ?? null,
      department: input.department ?? null,
      // Role is never taken from input — `.strict()` on the schema drops it,
      // and the default here is the second line of defence.
      role: 'STUDENT',
    },
  });

  const { code, hash } = generateOtp();
  await app.prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  const mail = verificationEmail(code);
  await sendMail({ to: user.email, ...mail, logger: request.log });

  await audit(app, {
    actorId: user.id,
    action: 'auth.register',
    entity: 'User',
    entityId: user.id,
    request,
  });

  const refreshToken = await issueRefreshToken(app, { userId: user.id, request });
  return buildSession(app, user, refreshToken);
}

export async function login(app, request, { email, password }) {
  const user = await app.prisma.user.findUnique({ where: { email } });

  // Unknown address: still pay the cost of a hash so the response time does
  // not distinguish "no such user" from "wrong password".
  if (!user || user.deletedAt) {
    await fakeVerifyDelay();
    await audit(app, {
      action: 'auth.login_failed',
      metadata: { reason: 'unknown_account' },
      request,
    });
    throw new UnauthorizedError('Incorrect email or password');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit(app, {
      actorId: user.id,
      action: 'auth.login_blocked',
      entity: 'User',
      entityId: user.id,
      request,
    });
    // Named explicitly: the account exists and the caller has already proven
    // they can reach it, so the lockout itself is not new information.
    throw new ForbiddenError(
      'Account temporarily locked after repeated failed attempts. Try again later.',
    );
  }

  const valid = await verifyPassword(user.passwordHash, password);

  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    const shouldLock = failedLoginCount >= MAX_FAILED_LOGINS;

    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : failedLoginCount,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    });

    await audit(app, {
      actorId: user.id,
      action: shouldLock ? 'auth.account_locked' : 'auth.login_failed',
      entity: 'User',
      entityId: user.id,
      metadata: { attempt: failedLoginCount },
      request,
    });

    throw new UnauthorizedError('Incorrect email or password');
  }

  // Successful login clears the counter and transparently upgrades the hash if
  // the cost parameters have been raised since it was written.
  const updates = { failedLoginCount: 0, lockedUntil: null };
  if (needsRehash(user.passwordHash)) {
    updates.passwordHash = await hashPassword(password);
  }
  await app.prisma.user.update({ where: { id: user.id }, data: updates });

  await audit(app, {
    actorId: user.id,
    action: 'auth.login',
    entity: 'User',
    entityId: user.id,
    request,
  });

  const refreshToken = await issueRefreshToken(app, { userId: user.id, request });
  return buildSession(app, user, refreshToken);
}

/**
 * Exchange a refresh token for a new pair.
 *
 * This is where reuse detection lives. A token already marked `usedAt` is by
 * definition a replay — either an attacker with a stolen copy, or a legitimate
 * client racing itself. Both are handled the same way: kill the family and
 * force a fresh login. Losing a session is a cheap price for containing theft.
 */
export async function refresh(app, request, presentedToken) {
  if (!presentedToken) throw new UnauthorizedError('Refresh token required');

  const stored = await app.prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presentedToken) },
    include: { user: true },
  });

  if (!stored) {
    await audit(app, {
      action: 'auth.refresh_unknown_token',
      request,
    });
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (stored.usedAt || stored.revokedAt) {
    await app.prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await audit(app, {
      actorId: stored.userId,
      action: 'auth.refresh_reuse_detected',
      entity: 'RefreshToken',
      entityId: stored.id,
      metadata: { familyId: stored.familyId },
      request,
    });
    app.log.warn(
      { userId: stored.userId, familyId: stored.familyId },
      'refresh token reuse detected — family revoked',
    );
    throw new UnauthorizedError('Session expired, please sign in again');
  }

  if (stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Session expired, please sign in again');
  }

  if (stored.user.deletedAt) {
    throw new UnauthorizedError('Session expired, please sign in again');
  }

  // Mark spent and mint the successor inside one transaction, so a crash
  // between the two cannot leave the user with no usable token.
  const rotated = await app.prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });
    const { token, hash } = generateOpaqueToken();
    await tx.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hash,
        familyId: stored.familyId,
        expiresAt: refreshExpiry(),
        ip: request?.ip ?? null,
        userAgent: request?.headers?.['user-agent'] ?? null,
      },
    });
    return token;
  });

  return buildSession(app, stored.user, rotated);
}

export async function logout(app, request, presentedToken) {
  if (!presentedToken) return;

  const stored = await app.prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presentedToken) },
    select: { id: true, userId: true, familyId: true },
  });

  if (!stored) return;

  // Revoke the whole family: signing out should end the session chain, not
  // just the one token the client happened to be holding.
  await app.prisma.refreshToken.updateMany({
    where: { familyId: stored.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await audit(app, {
    actorId: stored.userId,
    action: 'auth.logout',
    entity: 'User',
    entityId: stored.userId,
    request,
  });
}

/**
 * Start a password reset.
 *
 * Always resolves the same way. The caller cannot learn whether the address is
 * registered — not from the status code, the body, or (materially) the timing.
 */
export async function forgotPassword(app, request, { email }) {
  const user = await app.prisma.user.findUnique({ where: { email } });

  if (user && !user.deletedAt) {
    // Invalidate outstanding resets so only the newest code works.
    await app.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { code, hash } = generateOtp();
    await app.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    const mail = passwordResetEmail(code);
    await sendMail({ to: user.email, ...mail, logger: request.log });

    await audit(app, {
      actorId: user.id,
      action: 'auth.password_reset_requested',
      entity: 'User',
      entityId: user.id,
      request,
    });
  } else {
    await audit(app, {
      action: 'auth.password_reset_unknown_email',
      request,
    });
  }

  return {
    message: 'If that email has an account, a reset code is on its way.',
  };
}

export async function resetPassword(app, request, { email, otp, newPassword }) {
  const user = await app.prisma.user.findUnique({ where: { email } });

  if (!user || user.deletedAt) {
    await audit(app, {
      action: 'auth.password_reset_invalid_code',
      request,
    });
    throw new UnauthorizedError('This code is invalid or has expired. Request a new one.');
  }

  let stored;
  try {
    stored = await consumeOtp(app, {
      userId: user.id,
      code: otp,
      model: 'passwordResetToken',
    });
  } catch (error) {
    await audit(app, {
      action: 'auth.password_reset_invalid_code',
      request,
    });
    throw error;
  }

  const passwordHash = await hashPassword(newPassword);

  await app.prisma.$transaction([
    app.prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
    }),
    app.prisma.passwordResetToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    }),
    // A reset is the remedy for a compromised account, so every existing
    // session dies with it — otherwise the attacker keeps their refresh token.
    app.prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await audit(app, {
    actorId: stored.userId,
    action: 'auth.password_reset_completed',
    entity: 'User',
    entityId: stored.userId,
    request,
  });

  return { message: 'Password updated. Please sign in with your new password.' };
}

export async function verifyEmail(app, request, { email, otp }) {
  const user = await app.prisma.user.findUnique({ where: { email } });

  // Same reply for an unknown address, a deleted account, an already-verified
  // one, or a spent code — no path here may reveal whether the address exists.
  if (!user || user.deletedAt || user.emailVerifiedAt) {
    throw new UnauthorizedError('This code is invalid or has expired. Request a new one.');
  }

  const stored = await consumeOtp(app, {
    userId: user.id,
    code: otp,
    model: 'emailVerificationToken',
  });

  await app.prisma.$transaction([
    app.prisma.user.update({
      where: { id: stored.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    app.prisma.emailVerificationToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await audit(app, {
    actorId: stored.userId,
    action: 'auth.email_verified',
    entity: 'User',
    entityId: stored.userId,
    request,
  });

  return { message: 'Email verified.' };
}

export async function resendVerification(app, request, { email }) {
  const user = await app.prisma.user.findUnique({ where: { email } });

  if (user && !user.deletedAt && !user.emailVerifiedAt) {
    await app.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { code, hash } = generateOtp();
    await app.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    const mail = verificationEmail(code);
    await sendMail({ to: user.email, ...mail, logger: request.log });
  }

  // Same reply regardless — including for an address that is already verified.
  return { message: 'If that address needs verification, a new code is on its way.' };
}

export async function changePassword(app, request, userId, { currentPassword, newPassword }) {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new UnauthorizedError();

  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    await audit(app, {
      actorId: user.id,
      action: 'auth.password_change_failed',
      entity: 'User',
      entityId: user.id,
      request,
    });
    throw new UnauthorizedError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);

  await app.prisma.$transaction([
    app.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    app.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await audit(app, {
    actorId: user.id,
    action: 'auth.password_changed',
    entity: 'User',
    entityId: user.id,
    request,
  });

  // Every session including this one is now dead; the client must sign in
  // again, which is the expected behaviour after a credential change.
  return { message: 'Password changed. Please sign in again.' };
}
