import { otpService } from '../../src/services/otp.service';
import { getRedisClient } from '../../src/config/redis';

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  getRedisClient: jest.fn(),
}));

// Mock external HTTP (MSG91)
jest.mock('axios');

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
};

(getRedisClient as jest.Mock).mockReturnValue(mockRedis);

describe('OtpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should generate and store OTP in Redis', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // no lock
      mockRedis.incr.mockResolvedValueOnce(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue('OK');

      await otpService.sendOtp('+919876543210');

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('otp:+919876543210'),
        expect.any(String),
        'EX',
        expect.any(Number)
      );
    });

    it('should throw RATE_LIMITED when over the limit', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // no hard lock
      mockRedis.incr.mockResolvedValueOnce(5); // > limit
      mockRedis.ttl.mockResolvedValue(300);

      await expect(otpService.sendOtp('+919876543210')).rejects.toMatchObject({
        code: 'RATE_LIMITED',
      });
    });
  });

  describe('verifyOtp', () => {
    it('should resolve when OTP matches', async () => {
      // Must match hash stored
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('otp_lock:')) return null;
        if (key.startsWith('otp:')) {
          // The service hashes the OTP before storing
          const crypto = require('crypto');
          const hash = crypto.createHash('sha256').update('123456').digest('hex');
          return `${hash}:${Date.now() + 600_000}`;
        }
        return null;
      });
      mockRedis.del.mockResolvedValue(1);

      await expect(otpService.verifyOtp('+919876543210', '123456')).resolves.not.toThrow();
    });

    it('should throw INVALID_OTP when code is wrong', async () => {
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('otp_lock:')) return null;
        if (key.startsWith('otp:')) {
          const crypto = require('crypto');
          const hash = crypto.createHash('sha256').update('999999').digest('hex');
          return `${hash}:${Date.now() + 600_000}`;
        }
        if (key.startsWith('otp_fail:')) return null;
        return null;
      });
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      await expect(otpService.verifyOtp('+919876543210', '123456')).rejects.toMatchObject({
        code: 'INVALID_OTP',
      });
    });
  });
});
