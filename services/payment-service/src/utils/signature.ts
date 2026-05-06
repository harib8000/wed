import crypto from 'crypto';
import { config } from '../config';

/**
 * Verifies a Razorpay webhook signature.
 * Uses HMAC-SHA256 with the webhook secret.
 * OWASP: uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  
  // Timing-safe comparison
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies a Razorpay payment signature (client-side verification after payment).
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
