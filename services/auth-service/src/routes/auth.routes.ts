import { Router, Request, Response, NextFunction } from 'express';
import { otpService } from '../services/otp.service';
import { userService } from '../services/user.service';
import { jwtService } from '../services/jwt.service';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth.middleware';
import {
  SendOtpSchema,
  VerifyOtpSchema,
  RegisterVendorSchema,
} from '../types/auth.types';
import { logger } from '../utils/logger';

export const authRouter = Router();

// ─── POST /auth/send-otp ────────────────────────────────────────────────────

authRouter.post(
  '/send-otp',
  validate(SendOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;
      await otpService.sendOtp(phone);

      res.status(200).json({
        success: true,
        data: {
          message: 'OTP sent successfully',
          expiresInMinutes: 10,
        },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const otpErr = err as { code: string; ttlSeconds?: number; attemptsLeft?: number };
        if (otpErr.code === 'RATE_LIMITED') {
          return res.status(429).json({
            success: false,
            error: {
              code: 'AUTH_1003',
              message: `Too many OTP requests. Try again in ${Math.ceil((otpErr.ttlSeconds ?? 60) / 60)} minutes.`,
            },
            meta: {
              requestId: req.headers['x-request-id'],
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (otpErr.code === 'LOCKED') {
          return res.status(423).json({
            success: false,
            error: {
              code: 'AUTH_1004',
              message: `Account locked. Try again in ${Math.ceil((otpErr.ttlSeconds ?? 1800) / 60)} minutes.`,
            },
            meta: {
              requestId: req.headers['x-request-id'],
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
      next(err);
    }
  }
);

// ─── POST /auth/verify-otp ──────────────────────────────────────────────────

authRouter.post(
  '/verify-otp',
  validate(VerifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, otp, deviceId } = req.body;

      await otpService.verifyOtp(phone, otp);

      // Find or create user
      const user = await userService.findOrCreateByPhone(phone);

      // Issue token pair
      const { accessToken, refreshToken, expiresIn } =
        await userService.issueTokenPair(user, deviceId);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/auth/refresh',
      });

      logger.info({ userId: user.id, phone: user.phone }, 'User logged in');

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          expiresIn,
          user: {
            id: user.id,
            phone: user.phone,
            role: user.role,
            phoneVerified: user.phoneVerified,
          },
        },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const otpErr = err as { code: string; ttlSeconds?: number; attemptsLeft?: number };
        const statusMap: Record<string, number> = {
          INVALID_OTP: 400,
          OTP_EXPIRED: 400,
          LOCKED: 423,
        };
        const msgMap: Record<string, string> = {
          INVALID_OTP: `Invalid OTP. ${otpErr.attemptsLeft ?? 0} attempts remaining.`,
          OTP_EXPIRED: 'OTP has expired. Please request a new one.',
          LOCKED: `Account locked. Try again in ${Math.ceil((otpErr.ttlSeconds ?? 1800) / 60)} minutes.`,
        };
        const codeMap: Record<string, string> = {
          INVALID_OTP: 'AUTH_1001',
          OTP_EXPIRED: 'AUTH_1002',
          LOCKED: 'AUTH_1004',
        };
        if (otpErr.code in statusMap) {
          return res.status(statusMap[otpErr.code]).json({
            success: false,
            error: {
              code: codeMap[otpErr.code],
              message: msgMap[otpErr.code],
              field: 'otp',
            },
            meta: {
              requestId: req.headers['x-request-id'],
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
      next(err);
    }
  }
);

// ─── POST /auth/refresh ─────────────────────────────────────────────────────

authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Accept from cookie or body
      const refreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_1007', message: 'Refresh token required' },
          meta: {
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { accessToken, refreshToken: newRefreshToken, expiresIn } =
        await userService.rotateRefreshToken(refreshToken, req.body?.deviceId);

      // Rotate cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/auth/refresh',
      });

      res.status(200).json({
        success: true,
        data: { accessToken, expiresIn },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_REFRESH_TOKEN') {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_1006', message: 'Invalid refresh token' },
          meta: {
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString(),
          },
        });
      }
      next(err);
    }
  }
);

// ─── POST /auth/logout ──────────────────────────────────────────────────────

authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization!;
    const accessToken = authHeader.slice(7);
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    await userService.revokeSession(req.user!.id, accessToken, refreshToken);

    // Clear cookie
    res.clearCookie('refreshToken', { path: '/auth/refresh' });

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
      meta: {
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /auth/me ───────────────────────────────────────────────────────────

authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'RES_3001', message: 'User not found' },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      },
      meta: {
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/register-vendor ─────────────────────────────────────────────

authRouter.post(
  '/register-vendor',
  validate(RegisterVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;

      // Check if already a vendor
      const existing = await userService.findByPhone(phone);
      if (existing && existing.role === 'vendor') {
        return res.status(409).json({
          success: false,
          error: { code: 'RES_3002', message: 'A vendor with this phone is already registered' },
          meta: {
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString(),
          },
        });
      }

      const user = await userService.findOrCreateByPhone(phone, 'vendor');

      res.status(201).json({
        success: true,
        data: {
          message: 'Vendor account created. Please verify your phone to continue.',
          userId: user.id,
        },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /health ────────────────────────────────────────────────────────────

authRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});
