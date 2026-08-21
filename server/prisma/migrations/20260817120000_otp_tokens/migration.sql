-- Email verification and password reset now use 6-digit OTPs.
--
-- A numeric code has only ~10^6 possible values, so the same code is legitimately
-- issued to many users; the old unique token-hash constraint would reject that
-- collision. Each row now also counts failed attempts so a code can be locked
-- out against brute force.
--
-- The hashes stay irreversible: SHA-256 keyed with the pepper, computed in
-- src/lib/crypto.js. Plaintext codes are never stored.

DROP INDEX IF EXISTS "email_verification_tokens_tokenHash_key";
DROP INDEX IF EXISTS "password_reset_tokens_tokenHash_key";

ALTER TABLE "email_verification_tokens" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "password_reset_tokens" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;