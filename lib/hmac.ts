import crypto from 'node:crypto';

/**
 * Verify an HMAC-SHA256 signature in the format `sha256=<hex>`.
 *
 * Returns true iff `expected` matches the signature computed from `body`
 * using the given secret, compared in constant time. Malformed headers or
 * length mismatches return false — we never raise to the caller so the
 * route handler can always return a generic 401.
 */
export function verifyHmacSha256(body: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;

  const prefix = 'sha256=';
  const provided = signatureHeader.startsWith(prefix) ? signatureHeader.slice(prefix.length) : signatureHeader;
  if (!/^[a-f0-9]+$/i.test(provided)) return false;

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (expected.length !== provided.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}

export function signHmacSha256(body: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}
