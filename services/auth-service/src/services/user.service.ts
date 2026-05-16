import { prisma } from '../config/database';
import { getRedisClient } from '../config/redis';
import { jwtService } from './jwt.service';
import { hashSha256 as hashValue } from '@wedding-os/shared-utils';
import { UnauthorizedError } from '@wedding-os/shared-errors';
import { randomUUID } from 'crypto';

const generateTokenId = (): string => randomUUID();
import type { User } from '@prisma/client';

const BLACKLIST_PREFIX = 'token_blacklist:';

export class UserService {
  async findOrCreateByPhone(phone: string, role: 'customer' | 'vendor' = 'customer'): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return existing;

    return prisma.user.create({
      data: {
        phone,
        role,
        phoneVerified: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  }

  /** Issue access + refresh token pair */
  async issueTokenPair(
    user: User,
    deviceId?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const jti = generateTokenId();

    // Sign access token
    const accessToken = jwtService.signAccessToken({
      sub: user.id,
      role: user.role,
      phone: user.phone,
    });

    // Sign refresh token
    const refreshToken = jwtService.signRefreshToken(user.id, jti);

    // Store refresh token hash in DB
    const tokenHash = hashValue(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtService.getAccessTokenTtlMs() / 1000,
    };
  }

  /** Rotate refresh token (revoke old, issue new pair) */
  async rotateRefreshToken(
    refreshToken: string,
    deviceId?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    // 1. Verify JWT
    const payload = jwtService.verifyRefreshToken(refreshToken);

    // 2. Find stored token hash
    const tokenHash = hashValue(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    if (storedToken.userId !== payload.sub) {
      throw new UnauthorizedError('Token does not match user');
    }

    // 3. Revoke old token
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    // 4. Issue new pair
    return this.issueTokenPair(storedToken.user, deviceId);
  }

  /** Blacklist access token in Redis + revoke refresh token */
  async revokeSession(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    // Blacklist access token until it expires
    const payload = jwtService.verifyAccessToken(accessToken);
    const ttlSeconds = payload.exp - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      const redis = getRedisClient();
      await redis.setex(`${BLACKLIST_PREFIX}${accessToken}`, ttlSeconds, '1');
    }

    // Revoke refresh token if provided
    if (refreshToken) {
      const tokenHash = hashValue(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { revokedAt: new Date() },
      });
    }
  }

  /** Check if an access token is blacklisted */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = getRedisClient();
    const exists = await redis.exists(`${BLACKLIST_PREFIX}${token}`);
    return exists === 1;
  }

  /** Clean up expired refresh tokens (run periodically) */
  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

export const userService = new UserService();
