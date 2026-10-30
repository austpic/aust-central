import { describe, expect, it } from 'vitest';

import { loadEnv } from '../src/config/env.js';
import { passwordResetEmail, verificationEmail } from '../src/lib/mailer.js';

/**
 * Environment contract. These are the misconfigurations that boot fine and
 * fail quietly in production, so each one must stop the process instead.
 */

const PRODUCTION = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://aust:secret@db:5432/aust_central',
  JWT_ACCESS_SECRET: 'prod-jwt-access-secret-for-tests-only-00001',
  PASSWORD_PEPPER: 'prod-password-pepper-for-tests-only-0000002',
  PUBLIC_URL: 'https://central.example.edu',
  APP_URL: 'https://central.example.edu',
  CORS_ORIGINS: 'https://central.example.edu',
  SMTP_HOST: 'smtp.example.edu',
  TRUST_PROXY: '1',
};

/** Silences the boot-time error print so the test output stays readable. */
function attempt(source) {
  const original = console.error;
  console.error = () => {};
  try {
    return loadEnv(source);
  } finally {
    console.error = original;
  }
}

describe('production environment', () => {
  it('accepts a complete configuration', () => {
    const env = attempt(PRODUCTION);
    expect(env.TRUST_PROXY).toBe(1);
    expect(env.APP_URL).toBe('https://central.example.edu');
  });

  it.each([
    ['APP_URL over plain http', { APP_URL: 'http://central.example.edu' }],
    ['PUBLIC_URL over plain http', { PUBLIC_URL: 'http://central.example.edu' }],
    ['no SMTP host', { SMTP_HOST: undefined }],
    ['a wildcard CORS origin', { CORS_ORIGINS: '*' }],
    ['the pepper reused as the JWT secret', { PASSWORD_PEPPER: PRODUCTION.JWT_ACCESS_SECRET }],
    ['X-Forwarded-For trusted from anyone', { TRUST_PROXY: 'true' }],
  ])('refuses to boot with %s', (_label, override) => {
    expect(() => attempt({ ...PRODUCTION, ...override })).toThrow(
      'Invalid environment configuration',
    );
  });
});

describe('TRUST_PROXY parsing', () => {
  const parse = (value) => attempt({ ...PRODUCTION, NODE_ENV: 'development', TRUST_PROXY: value });

  it('defaults to not trusting forwarded headers', () => {
    expect(attempt({ ...PRODUCTION, TRUST_PROXY: undefined, NODE_ENV: 'development' }).TRUST_PROXY)
      .toBe(false);
  });

  it('reads a hop count or an address list', () => {
    expect(parse('2').TRUST_PROXY).toBe(2);
    expect(parse('10.0.0.1, 10.0.0.0/8').TRUST_PROXY).toEqual(['10.0.0.1', '10.0.0.0/8']);
  });
});

describe('emailed links', () => {
  // The token pages are web-client routes; the API serves neither path.
  it('point at the web app, not the API', () => {
    expect(passwordResetEmail('abc').text).toContain(
      `${process.env.APP_URL ?? 'http://localhost:5173'}/reset-password?token=abc`,
    );
    expect(verificationEmail('abc').text).toContain('/verify-email?token=abc');
  });
});
