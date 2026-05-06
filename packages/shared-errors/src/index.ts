// ─── Base Error ──────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    isOperational = true,
    field?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.field = field;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Auth Errors (AUTH_1xxx) ─────────────────────────────────────────────────

export class OtpInvalidError extends AppError {
  constructor() {
    super('AUTH_1001', 'Invalid OTP. Please try again.', 400, true, 'otp');
  }
}

export class OtpExpiredError extends AppError {
  constructor() {
    super('AUTH_1002', 'OTP has expired. Please request a new one.', 400, true, 'otp');
  }
}

export class RateLimitedError extends AppError {
  constructor(retryAfterSeconds?: number) {
    super(
      'AUTH_1003',
      `Too many requests. ${retryAfterSeconds ? `Try again in ${retryAfterSeconds} seconds.` : 'Please try again later.'}`,
      429,
      true
    );
  }
}

export class AccountLockedError extends AppError {
  constructor(unlockMinutes = 30) {
    super(
      'AUTH_1004',
      `Account locked due to too many failed attempts. Try again in ${unlockMinutes} minutes.`,
      423,
      true
    );
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('AUTH_1005', 'Token has expired. Please login again.', 401, true);
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super('AUTH_1006', 'Invalid token.', 401, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super('AUTH_1007', message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super('AUTH_1008', message, 403, true);
  }
}

// ─── Validation Errors (VAL_2xxx) ────────────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super('VAL_2001', message, 400, true, field, details);
  }
}

// ─── Resource Errors (RES_3xxx) ──────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'RES_3001',
      id ? `${resource} with id '${id}' not found.` : `${resource} not found.`,
      404,
      true
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super('RES_3002', message, 409, true, field);
  }
}

// ─── Booking Errors (BOOK_4xxx) ──────────────────────────────────────────────

export class VendorNotAvailableError extends AppError {
  constructor(date: string) {
    super(
      'BOOK_4001',
      `This vendor is not available on ${date}.`,
      409,
      true,
      'eventDate'
    );
  }
}

export class BookingAlreadyConfirmedError extends AppError {
  constructor() {
    super('BOOK_4002', 'This booking has already been confirmed.', 409, true);
  }
}

export class BookingCancellationError extends AppError {
  constructor(reason: string) {
    super('BOOK_4003', `Cannot cancel booking: ${reason}`, 400, true);
  }
}

// ─── Payment Errors (PAY_5xxx) ───────────────────────────────────────────────

export class PaymentVerificationError extends AppError {
  constructor() {
    super('PAY_5001', 'Payment signature verification failed.', 400, true);
  }
}

export class EscrowNotFoundError extends AppError {
  constructor(bookingId: string) {
    super('PAY_5002', `No escrow found for booking ${bookingId}.`, 404, true);
  }
}

export class InsufficientFundsError extends AppError {
  constructor() {
    super('PAY_5003', 'Insufficient funds in wallet.', 400, true);
  }
}

export class DuplicatePaymentError extends AppError {
  constructor() {
    super('PAY_5004', 'This payment has already been processed.', 409, true);
  }
}

// ─── Vendor Errors (VEN_6xxx) ────────────────────────────────────────────────

export class VendorNotVerifiedError extends AppError {
  constructor() {
    super('VEN_6001', 'Vendor KYC verification is still pending.', 403, true);
  }
}

export class VendorSubscriptionRequiredError extends AppError {
  constructor(feature: string) {
    super(
      'VEN_6002',
      `This feature (${feature}) requires a Premium or Enterprise subscription.`,
      402,
      true
    );
  }
}

// ─── System Errors (SYS_9xxx) ────────────────────────────────────────────────

export class InternalError extends AppError {
  constructor(message = 'An internal error occurred.') {
    super('SYS_9001', message, 500, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super('SYS_9002', `Service ${service} is temporarily unavailable.`, 503, true);
  }
}
