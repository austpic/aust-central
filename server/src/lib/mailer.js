import nodemailer from 'nodemailer';

import { env, isProduction } from '../config/env.js';

/**
 * Outbound mail for password reset and address verification.
 *
 * With no SMTP host configured (the default in development and test) the
 * transport falls back to logging. Password reset stays fully testable locally
 * without wiring a real mail server — and, more importantly, no half-configured
 * dev box can accidentally send mail to a real student's inbox.
 */

let transport = null;

function getTransport(logger) {
  if (transport) return transport;

  if (!env.SMTP_HOST) {
    if (isProduction) {
      // Unreachable in practice: env validation already rejects this.
      throw new Error('SMTP_HOST is required in production');
    }
    transport = {
      async sendMail(message) {
        logger?.warn(
          { to: message.to, subject: message.subject, text: message.text },
          'SMTP not configured — email logged instead of sent',
        );
        return { messageId: 'logged-not-sent' };
      },
    };
    return transport;
  }

  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 465,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });

  return transport;
}

/**
 * Send an email. Never throws into the request path.
 *
 * A failed send must not fail the HTTP request: if `/forgot-password` returned
 * 500 when SMTP was down, that difference in behaviour would itself reveal
 * which addresses have accounts. Errors are logged and swallowed.
 *
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.text
 * @param {import('pino').Logger} [params.logger]
 */
export async function sendMail({ to, subject, text, logger }) {
  try {
    const mailer = getTransport(logger);
    await mailer.sendMail({ from: env.MAIL_FROM, to, subject, text });
    logger?.info({ to, subject }, 'email sent');
    return true;
  } catch (error) {
    logger?.error({ err: error, to, subject }, 'failed to send email');
    return false;
  }
}

/** @param {string} otp */
export function passwordResetEmail(otp) {
  return {
    subject: 'Your AUST Central password reset code',
    text: [
      'We received a request to reset your AUST Central password.',
      '',
      `Your reset code is: ${otp}`,
      '',
      'Enter this code on the password reset screen. It can be used once and expires in 15 minutes.',
      "If you didn't request this, you can ignore this email — your password will not change.",
    ].join('\n'),
  };
}

/** @param {string} otp */
export function verificationEmail(otp) {
  return {
    subject: 'Your AUST Central verification code',
    text: [
      'Welcome to AUST Central.',
      '',
      `Your verification code is: ${otp}`,
      '',
      'Enter this code on the verification screen. It can be used once and expires in 15 minutes.',
    ].join('\n'),
  };
}

/** Test seam: drop the memoised transport. */
export function resetTransport() {
  transport = null;
}
