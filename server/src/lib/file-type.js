/**
 * Magic-byte sniffing for uploads.
 *
 * The client's `Content-Type` header and the filename extension are both
 * attacker-controlled and must never decide how a file is stored or served.
 * A polyglot named `avatar.png` that is really an HTML document becomes stored
 * XSS the moment a browser renders it; one that is really a script becomes
 * worse if it ever lands somewhere executable.
 *
 * So: the type is derived from the bytes, and only an explicit allowlist of
 * raster image formats is accepted. Anything unrecognised is rejected rather
 * than stored as "application/octet-stream", because a file we cannot identify
 * is a file we cannot reason about.
 */

/** SVG is deliberately absent — it is XML, it can carry script, and it is a
 * standing XSS vector when served inline. */
const SIGNATURES = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    test: (b) =>
      b.length > 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: 'image/gif',
    extension: 'gif',
    test: (b) => b.length > 6 && b.subarray(0, 6).toString('latin1').match(/^GIF8[79]a$/) !== null,
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

/**
 * Identify a buffer by its leading bytes.
 *
 * @param {Buffer} buffer
 * @returns {{ mime: string, extension: string } | null} Null when unrecognised.
 */
export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  for (const signature of SIGNATURES) {
    if (signature.test(buffer)) {
      return { mime: signature.mime, extension: signature.extension };
    }
  }
  return null;
}

export const ALLOWED_IMAGE_MIMES = SIGNATURES.map((s) => s.mime);
