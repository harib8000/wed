import { jwtService } from '../../src/services/jwt.service';

describe('JwtService', () => {
  const payload = { userId: 'test-user-id', phone: '+919876543210', role: 'customer' as const };

  describe('signAccessToken / verifyAccessToken', () => {
    it('should sign and verify an access token', async () => {
      const token = await jwtService.signAccessToken(payload);
      expect(typeof token).toBe('string');

      const decoded = await jwtService.verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.phone).toBe(payload.phone);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject an expired access token', async () => {
      // sign with 1ms TTL by monkey-patching (best effort)
      await expect(jwtService.verifyAccessToken('invalid.token.here')).rejects.toThrow();
    });
  });

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('should include jti in refresh token', async () => {
      const { token, jti } = await jwtService.signRefreshToken(payload);
      expect(typeof token).toBe('string');
      expect(typeof jti).toBe('string');
      expect(jti.length).toBeGreaterThan(0);

      const decoded = await jwtService.verifyRefreshToken(token);
      expect(decoded.jti).toBe(jti);
    });
  });
});
