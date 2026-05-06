import { getRedisClient } from '../config/redis';
import { config } from '../config';
import { generateOtp, hashValue, safeCompare } from '../utils/crypto';
import { logger } from '../utils/logger';
import axios from 'axios';

const OTP_PREFIX = 'otp:';
const RATE_LIMIT_PREFIX = 'otp_rate:';
const LOCKOUT_PREFIX = 'otp_lock:';
const FAIL_COUNT_PREFIX = 'otp_fail:';

export class OtpService {
  /** Generate, hash, store, and send OTP */
  async sendOtp(phone: string): Promise<void> {
    const redis = getRedisClient();

    // 1. Check lockout
    const lockKey = `${LOCKOUT_PREFIX}${phone}`;
    const isLocked = await redis.exists(lockKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockKey);
      throw { code: 'LOCKED', ttlSeconds: ttl };
    }

    // 2. Check rate limit (3 requests per 10 minutes)
    const rateKey = `${RATE_LIMIT_PREFIX}${phone}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) {
      await redis.expire(rateKey, config.OTP_RATE_LIMIT_WINDOW_MINUTES * 60);
    }
    if (rateCount > config.OTP_RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(rateKey);
      throw { code: 'RATE_LIMITED', ttlSeconds: ttl };
    }

    // 3. Generate OTP
    const otp = generateOtp();
    const otpHash = hashValue(otp);

    // 4. Store hash in Redis with TTL
    const otpKey = `${OTP_PREFIX}${phone}`;
    await redis.setex(otpKey, config.OTP_TTL_MINUTES * 60, otpHash);

    // 5. Send SMS (skip in test mode)
    if (config.NODE_ENV !== 'test' && config.MSG91_AUTH_KEY) {
      await this.sendSms(phone, otp);
    } else {
      // In dev mode, log OTP
      logger.info({ phone, otp }, '📱 [DEV] OTP generated');
    }
  }

  /** Verify an OTP for a given phone */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const redis = getRedisClient();

    // 1. Check lockout
    const lockKey = `${LOCKOUT_PREFIX}${phone}`;
    const isLocked = await redis.exists(lockKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockKey);
      throw { code: 'LOCKED', ttlSeconds: ttl };
    }

    // 2. Retrieve stored hash
    const otpKey = `${OTP_PREFIX}${phone}`;
    const storedHash = await redis.get(otpKey);
    if (!storedHash) {
      throw { code: 'OTP_EXPIRED' };
    }

    // 3. Compare
    const inputHash = hashValue(otp);
    const isValid = safeCompare(inputHash, storedHash);

    if (!isValid) {
      // Track failed attempts
      const failKey = `${FAIL_COUNT_PREFIX}${phone}`;
      const failCount = await redis.incr(failKey);
      if (failCount === 1) {
        await redis.expire(failKey, config.OTP_TTL_MINUTES * 60);
      }

      if (failCount >= config.OTP_LOCKOUT_MAX_ATTEMPTS) {
        // Lock the account
        await redis.setex(lockKey, config.OTP_LOCKOUT_DURATION_MINUTES * 60, '1');
        await redis.del(failKey);
        throw { code: 'LOCKED', ttlSeconds: config.OTP_LOCKOUT_DURATION_MINUTES * 60 };
      }

      throw { code: 'INVALID_OTP', attemptsLeft: config.OTP_LOCKOUT_MAX_ATTEMPTS - failCount };
    }

    // 4. Valid — clean up
    await redis.del(otpKey);
    await redis.del(`${FAIL_COUNT_PREFIX}${phone}`);
    return true;
  }

  private async sendSms(phone: string, otp: string): Promise<void> {
    try {
      // Remove the + prefix for MSG91
      const mobileE164 = phone.replace('+', '');
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        {
          template_id: config.MSG91_OTP_TEMPLATE_ID,
          mobile: mobileE164,
          authkey: config.MSG91_AUTH_KEY,
          otp_length: 6,
          otp_expiry: config.OTP_TTL_MINUTES,
          // Override OTP value with our generated one
          otp,
        },
        { timeout: 5000 }
      );
      logger.info({ phone }, 'OTP SMS sent');
    } catch (err) {
      logger.error({ err, phone }, 'Failed to send OTP SMS');
      throw { code: 'SMS_FAILED' };
    }
  }
}

export const otpService = new OtpService();
