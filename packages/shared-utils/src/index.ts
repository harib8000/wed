import crypto from 'crypto';

// ─── Currency Utilities (INR) ────────────────────────────────────────────────

/** Convert rupees to paise (Razorpay uses paise) */
export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

/** Convert paise to rupees */
export const paiseToRupees = (paise: number): number => paise / 100;

/** Format rupees for display: ₹1,23,456 */
export const formatINR = (rupees: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);

// ─── Date Utilities ───────────────────────────────────────────────────────────

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const daysBetween = (start: Date, end: Date): number =>
  Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

/** Indian peak wedding season: November–February */
export const isPeakSeason = (date: Date): boolean => {
  const month = date.getMonth() + 1;
  return month === 11 || month === 12 || month === 1 || month === 2;
};

// ─── String / ID Utilities ───────────────────────────────────────────────────

export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WOS-${timestamp}-${random}`;
};

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const maskPhone = (phone: string): string =>
  phone.slice(0, 4) + '****' + phone.slice(-3);

// ─── Crypto Utilities ────────────────────────────────────────────────────────

/** Generate a cryptographically random 6-digit OTP */
export const generateOtp = (): string => {
  const buffer = crypto.randomBytes(3);
  const num = (buffer.readUIntBE(0, 3) % 900000) + 100000;
  return num.toString();
};

/** Hash a value with SHA-256 */
export const hashSha256 = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

/** Constant-time comparison (prevents timing attacks) */
export const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// ─── Validation Utilities ────────────────────────────────────────────────────

/** Validate Indian phone in E164 format: +91XXXXXXXXXX */
export const isValidIndianPhone = (phone: string): boolean =>
  /^\+91[6-9]\d{9}$/.test(phone);

/** Validate GST number format */
export const isValidGST = (gst: string): boolean =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);

/** Validate PAN number format */
export const isValidPAN = (pan: string): boolean =>
  /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

/** Validate IFSC code format */
export const isValidIFSC = (ifsc: string): boolean =>
  /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);

// ─── Pagination Utilities ────────────────────────────────────────────────────

export const encodeCursor = (id: string): string =>
  Buffer.from(JSON.stringify({ id })).toString('base64url');

export const decodeCursor = (cursor: string): { id: string } | null => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch {
    return null;
  }
};

// ─── Platform Fee Calculation ────────────────────────────────────────────────

export interface FeeCalculation {
  totalAmount: number;
  platformFee: number;
  gstOnFee: number;
  vendorPayout: number;
  razorpayFee: number;
  netToVendor: number;
}

export const calculatePlatformFee = (
  amount: number,
  commissionRate = 0.10
): FeeCalculation => {
  const platformFee = Math.round(amount * commissionRate);
  const gstOnFee = Math.round(platformFee * 0.18);
  const razorpayFee = Math.round(amount * 0.02);
  const vendorPayout = amount - platformFee - gstOnFee;
  const netToVendor = vendorPayout - razorpayFee;
  return { totalAmount: amount, platformFee, gstOnFee, vendorPayout, razorpayFee, netToVendor };
};
