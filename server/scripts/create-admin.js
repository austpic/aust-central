import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../src/lib/crypto.js';

/**
 * Grant a staff role, creating the account if it does not exist yet.
 *
 *   npm run admin:create -- --email registrar@aust.edu --name "Registrar Office"
 *   npm run admin:create -- --email mod@aust.edu --role MODERATOR
 *
 * Roles are never accepted over the API, so this is the only way to make the
 * first ADMIN (needed to post notices). Production-safe: it uses the same
 * environment — and therefore the same PASSWORD_PEPPER — as the server.
 *
 * An existing account keeps its password and is only promoted. A new one gets
 * a random password printed once; the holder should change it on first sign-in
 * (Profile → Change password) or use "Forgot password".
 */

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'ADMIN' },
  },
});

const ROLES = ['ADMIN', 'MODERATOR', 'STUDENT'];
const email = values.email?.trim().toLowerCase();

if (!email || !email.includes('@') || !ROLES.includes(values.role)) {
  console.error(
    'Usage: npm run admin:create -- --email <address> [--name <name>] [--role ADMIN|MODERATOR|STUDENT]',
  );
  process.exit(2);
}

const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: existing.id }, data: { role: values.role } }),
      // The role rides in the access token; ending the sessions makes the
      // change (a demotion especially) take effect now, not on next refresh.
      prisma.refreshToken.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    console.log(`${email}: role set to ${values.role}. Existing sessions were signed out.`);
  } else {
    // Mixed case and a digit, comfortably past any PASSWORD_MIN_LENGTH.
    const password = `Aa1${randomBytes(18).toString('base64url')}`;
    await prisma.user.create({
      data: {
        email,
        name: values.name?.trim() || email.split('@')[0],
        role: values.role,
        passwordHash: await hashPassword(password),
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Created ${email} (${values.role}).`);
    console.log(`One-time password: ${password}`);
    console.log('Change it after first sign-in. It is not stored anywhere else.');
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
