import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestApp, useCleanDatabase } from './helpers/app.js';
import * as crypto from '../src/lib/crypto.js';

/**
 * Auth suite.
 *
 * The security cases here are not extras — they are the reason this module was
 * written by hand instead of delegated to Firebase. Each one pins a behaviour
 * that is easy to regress and expensive to lose.
 */

let app;
beforeAll(async () => {
  app = await createTestApp();
});
useCleanDatabase(() => app);

const VALID = {
  name: 'Farhana Rahman',
  email: 'farhana@example.com',
  password: 'CorrectHorse7',
};

const post = (url, payload, headers) =>
  app.inject({ method: 'POST', url: `/api/v1/auth${url}`, payload, headers });

async function registerUser(overrides = {}) {
  const response = await post('/register', { ...VALID, ...overrides });
  return { response, body: response.json() };
}

/**
 * Pin OTP generation so tests know the code a user "receives".
 *
 * The mailer only logs in the test environment, so the code is not readable
 * from the transport; stubbing the generator is the next best thing — it
 * exercises the real storage, hashing, and comparison paths end to end.
 */
function fixedOtp() {
  const code = '123456';
  vi.spyOn(crypto, 'generateOtp').mockReturnValue({ code, hash: crypto.hashOtp(code) });
  return code;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('POST /auth/register', () => {
  it('creates an account and returns a session', async () => {
    const { response, body } = await registerUser();

    expect(response.statusCode).toBe(201);
    expect(body.user.email).toBe('farhana@example.com');
    expect(body.user.role).toBe('STUDENT');
    expect(body.user.emailVerified).toBe(false);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it('never exposes the password hash', async () => {
    const { response } = await registerUser();
    // Checked against the raw body, not the parsed object, so a hash nested
    // anywhere in the payload still trips this.
    expect(response.body).not.toContain('passwordHash');
    expect(response.body).not.toContain('$argon2');
  });

  it('sets the refresh token as an httpOnly cookie', async () => {
    const { response } = await registerUser();
    const cookie = response.cookies.find((c) => c.name === 'refresh_token');

    expect(cookie).toBeDefined();
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('Strict');
  });

  it('normalises email casing so one address cannot become two accounts', async () => {
    await registerUser({ email: 'Mixed.Case@Example.COM' });
    const duplicate = await post('/register', {
      ...VALID,
      email: 'mixed.case@example.com',
    });

    expect(duplicate.statusCode).toBe(409);
  });

  it.each([
    ['too short', 'Ab1'],
    ['no uppercase', 'lowercase123'],
    ['no digits', 'NoDigitsHere'],
  ])('rejects a password that is %s', async (_label, password) => {
    const response = await post('/register', { ...VALID, password });
    expect(response.statusCode).toBe(422);
  });

  it('ignores an attempt to self-assign a privileged role', async () => {
    // Mass assignment: .strict() drops the unknown key rather than persisting it.
    const response = await post('/register', { ...VALID, role: 'ADMIN' });

    expect(response.statusCode).toBe(422);
    const user = await app.prisma.user.findUnique({ where: { email: VALID.email } });
    expect(user).toBeNull();
  });
});

describe('POST /auth/login', () => {
  it('signs in with correct credentials', async () => {
    await registerUser();
    const response = await post('/login', {
      email: VALID.email,
      password: VALID.password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().accessToken).toBeTruthy();
  });

  it('gives the same answer for a wrong password and an unknown account', async () => {
    await registerUser();

    const wrongPassword = await post('/login', {
      email: VALID.email,
      password: 'WrongPassword9',
    });
    const unknownAccount = await post('/login', {
      email: 'nobody@example.com',
      password: 'WrongPassword9',
    });

    // Identical status AND message: any difference is an account oracle.
    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownAccount.statusCode).toBe(401);
    expect(unknownAccount.json().error.message).toBe(wrongPassword.json().error.message);
  });

  it('locks the account after repeated failures', async () => {
    await registerUser();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post('/login', { email: VALID.email, password: 'WrongPassword9' });
    }

    // Correct credentials are now refused too — that is the point of a lockout.
    const response = await post('/login', {
      email: VALID.email,
      password: VALID.password,
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.message).toMatch(/locked/i);
  });

  it('resets the failure counter after a successful sign-in', async () => {
    await registerUser();
    await post('/login', { email: VALID.email, password: 'WrongPassword9' });
    await post('/login', { email: VALID.email, password: VALID.password });

    const user = await app.prisma.user.findUnique({ where: { email: VALID.email } });
    expect(user.failedLoginCount).toBe(0);
  });
});

describe('POST /auth/refresh', () => {
  it('rotates the refresh token', async () => {
    const { body } = await registerUser();
    const response = await post('/refresh', { refreshToken: body.refreshToken });

    expect(response.statusCode).toBe(200);
    // A refresh that returned the same token would defeat reuse detection.
    expect(response.json().refreshToken).not.toBe(body.refreshToken);
  });

  it('revokes the whole family when a used token is replayed', async () => {
    const { body } = await registerUser();
    const first = await post('/refresh', { refreshToken: body.refreshToken });
    const rotated = first.json().refreshToken;

    // Replaying the spent token: the signature of a stolen credential.
    const replay = await post('/refresh', { refreshToken: body.refreshToken });
    expect(replay.statusCode).toBe(401);

    // The legitimate successor must die too — we cannot tell victim from thief,
    // so the safe move is to end the chain and force a fresh login.
    const afterBreach = await post('/refresh', { refreshToken: rotated });
    expect(afterBreach.statusCode).toBe(401);

    const live = await app.prisma.refreshToken.count({ where: { revokedAt: null } });
    expect(live).toBe(0);
  });

  it('records the breach in the audit log', async () => {
    const { body } = await registerUser();
    await post('/refresh', { refreshToken: body.refreshToken });
    await post('/refresh', { refreshToken: body.refreshToken });

    const entry = await app.prisma.auditLog.findFirst({
      where: { action: 'auth.refresh_reuse_detected' },
    });
    expect(entry).not.toBeNull();
  });

  it('rejects a token that was never issued', async () => {
    const response = await post('/refresh', { refreshToken: 'not-a-real-token' });
    expect(response.statusCode).toBe(401);
  });
});

describe('POST /auth/forgot-password', () => {
  it('answers identically for known and unknown addresses', async () => {
    await registerUser();

    const known = await post('/forgot-password', { email: VALID.email });
    const unknown = await post('/forgot-password', { email: 'nobody@example.com' });

    expect(known.statusCode).toBe(unknown.statusCode);
    expect(known.json()).toEqual(unknown.json());
  });

  it('supersedes any outstanding reset token', async () => {
    await registerUser();
    await post('/forgot-password', { email: VALID.email });
    await post('/forgot-password', { email: VALID.email });

    const unused = await app.prisma.passwordResetToken.count({ where: { usedAt: null } });
    expect(unused).toBe(1);
  });
});

describe('POST /auth/reset-password', () => {
  it('rejects a code that was never issued', async () => {
    await registerUser();
    const response = await post('/reset-password', {
      email: VALID.email,
      otp: '123456',
      newPassword: 'BrandNewPass1',
    });
    expect(response.statusCode).toBe(401);
  });

  it('resets the password with the emailed code and revokes every session', async () => {
    const { body } = await registerUser();
    const code = fixedOtp();
    await post('/forgot-password', { email: VALID.email });

    const response = await post('/reset-password', {
      email: VALID.email,
      otp: code,
      newPassword: 'BrandNewPass1',
    });
    expect(response.statusCode).toBe(200);

    // The old password no longer works.
    const oldLogin = await post('/login', { email: VALID.email, password: VALID.password });
    expect(oldLogin.statusCode).toBe(401);

    // The new password does.
    const newLogin = await post('/login', { email: VALID.email, password: 'BrandNewPass1' });
    expect(newLogin.statusCode).toBe(200);

    // The session issued at register dies with the reset.
    const stale = await post('/refresh', { refreshToken: body.refreshToken });
    expect(stale.statusCode).toBe(401);
  });

  it('accepts a reset code only once', async () => {
    await registerUser();
    const code = fixedOtp();
    await post('/forgot-password', { email: VALID.email });

    const first = await post('/reset-password', {
      email: VALID.email,
      otp: code,
      newPassword: 'BrandNewPass1',
    });
    expect(first.statusCode).toBe(200);

    const replay = await post('/reset-password', {
      email: VALID.email,
      otp: code,
      newPassword: 'AnotherPass1',
    });
    expect(replay.statusCode).toBe(401);
  });

  it('rejects a wrong reset code', async () => {
    await registerUser();
    await post('/forgot-password', { email: VALID.email });

    const response = await post('/reset-password', {
      email: VALID.email,
      otp: '000000',
      newPassword: 'BrandNewPass1',
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an expired reset code', async () => {
    await registerUser();
    const code = fixedOtp();
    await post('/forgot-password', { email: VALID.email });
    await app.prisma.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await post('/reset-password', {
      email: VALID.email,
      otp: code,
      newPassword: 'BrandNewPass1',
    });
    expect(response.statusCode).toBe(401);
  });

  it('locks the reset code after too many wrong attempts', async () => {
    await registerUser();
    const code = fixedOtp();
    await post('/forgot-password', { email: VALID.email });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post('/reset-password', {
        email: VALID.email,
        otp: '000000',
        newPassword: 'BrandNewPass1',
      });
    }

    // Even the correct code is now refused — the budget is spent.
    const correct = await post('/reset-password', {
      email: VALID.email,
      otp: code,
      newPassword: 'BrandNewPass1',
    });
    expect(correct.statusCode).toBe(403);
  });

  it('answers the same for an unknown email as for a spent code', async () => {
    const unknown = await post('/reset-password', {
      email: 'nobody@example.com',
      otp: '123456',
      newPassword: 'BrandNewPass1',
    });
    expect(unknown.statusCode).toBe(401);

    // Same message as the "never issued" case above — no account oracle.
    expect(unknown.json().error.message).toBe(
      'This code is invalid or has expired. Request a new one.',
    );
  });

  it('enforces the password policy on the new password', async () => {
    await registerUser();
    const code = fixedOtp();
    await post('/forgot-password', { email: VALID.email });

    const response = await post('/reset-password', {
      email: VALID.email,
      otp: code,
      newPassword: 'weak',
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().error.details.fields.newPassword).toBeDefined();
  });
});

describe('POST /auth/verify-email', () => {
  it('verifies the address with the emailed code, once', async () => {
    const code = fixedOtp();
    await registerUser();

    const response = await post('/verify-email', { email: VALID.email, otp: code });
    expect(response.statusCode).toBe(200);

    const user = await app.prisma.user.findUnique({ where: { email: VALID.email } });
    expect(user.emailVerifiedAt).not.toBeNull();

    // The same code cannot verify again.
    const replay = await post('/verify-email', { email: VALID.email, otp: code });
    expect(replay.statusCode).toBe(401);
  });

  it('rejects a wrong code', async () => {
    fixedOtp();
    await registerUser();
    const response = await post('/verify-email', { email: VALID.email, otp: '000000' });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.message).not.toBe('Email verified.');
  });

  it('rejects an expired code', async () => {
    const code = fixedOtp();
    await registerUser();
    await app.prisma.emailVerificationToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await post('/verify-email', { email: VALID.email, otp: code });
    expect(response.statusCode).toBe(401);
  });

  it('locks the code after too many wrong attempts', async () => {
    const code = fixedOtp();
    await registerUser();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post('/verify-email', { email: VALID.email, otp: '000000' });
    }

    const correct = await post('/verify-email', { email: VALID.email, otp: code });
    expect(correct.statusCode).toBe(403);
  });

  it('answers identically for an unknown address and a spent code', async () => {
    const unknown = await post('/verify-email', { email: 'nobody@example.com', otp: '123456' });
    expect(unknown.statusCode).toBe(401);

    const code = fixedOtp();
    await registerUser();
    await post('/verify-email', { email: VALID.email, otp: code });

    const spent = await post('/verify-email', { email: VALID.email, otp: code });
    expect(spent.statusCode).toBe(401);
    expect(spent.json().error.message).toBe(unknown.json().error.message);
  });

  it('does not let a resend before verification exceed one live code', async () => {
    const code = fixedOtp();
    await registerUser();
    await post('/resend-verification', { email: VALID.email });

    const live = await app.prisma.emailVerificationToken.count({ where: { usedAt: null } });
    expect(live).toBe(1);

    // The freshest code is the one emailed last.
    const response = await post('/verify-email', { email: VALID.email, otp: code });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /auth/me', () => {
  it('requires a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    // Forged token: right shape, wrong signature.
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJyb2xlIjoiQURNSU4ifQ.' +
      'bm90LWEtdmFsaWQtc2lnbmF0dXJl';

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${forged}` },
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns the signed-in user', async () => {
    const { body } = await registerUser();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${body.accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().email).toBe(VALID.email);
    expect(response.body).not.toContain('passwordHash');
  });
});

describe('PATCH /auth/password', () => {
  it('changes the password and kills every existing session', async () => {
    const { body } = await registerUser();

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/password',
      headers: { authorization: `Bearer ${body.accessToken}` },
      payload: { currentPassword: VALID.password, newPassword: 'DifferentPass2' },
    });

    expect(response.statusCode).toBe(200);

    // The old refresh token must not survive a credential change.
    const stale = await post('/refresh', { refreshToken: body.refreshToken });
    expect(stale.statusCode).toBe(401);

    const signIn = await post('/login', {
      email: VALID.email,
      password: 'DifferentPass2',
    });
    expect(signIn.statusCode).toBe(200);
  });

  it('refuses when the current password is wrong', async () => {
    const { body } = await registerUser();

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/password',
      headers: { authorization: `Bearer ${body.accessToken}` },
      payload: { currentPassword: 'NotMyPassword1', newPassword: 'DifferentPass2' },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the session', async () => {
    const { body } = await registerUser();

    const response = await post('/logout', { refreshToken: body.refreshToken });
    expect(response.statusCode).toBe(200);

    const reuse = await post('/refresh', { refreshToken: body.refreshToken });
    expect(reuse.statusCode).toBe(401);
  });
});
