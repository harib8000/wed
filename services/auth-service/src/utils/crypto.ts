import crypto from 'crypto';

export const generateOtp = (): string => {
  const buf = crypto.randomBytes(3);
  const num = (buf.readUIntBE(0, 3) % 900000) + 100000;
  return num.toString();
};

export const hashValue = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

export const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

export const generateTokenId = (): string => crypto.randomUUID();
