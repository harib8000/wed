import jwt from 'jsonwebtoken';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';

let privateKey: string;
let publicKey: string;

function loadKeys(): void {
  if (privateKey && publicKey) return;

  if (config.JWT_PRIVATE_KEY) {
    privateKey = config.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else if (config.JWT_PRIVATE_KEY_PATH) {
    privateKey = fs.readFileSync(config.JWT_PRIVATE_KEY_PATH, 'utf8');
  } else {
    // Generate ephemeral RSA keys for development
    logger.warn('No JWT keys configured — using ephemeral keys (development only)');
    const { generateKeyPairSync } = require('crypto');
    const { privateKey: priv, publicKey: pub } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    privateKey = priv;
    publicKey = pub;
    return;
  }

  if (config.JWT_PUBLIC_KEY) {
    publicKey = config.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
  } else if (config.JWT_PUBLIC_KEY_PATH) {
    publicKey = fs.readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf8');
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AccessTokenPayload {
  sub: string;
  role: string;
  phone: string;
}

export class JwtService {
  signAccessToken(payload: AccessTokenPayload): string {
    loadKeys();
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: config.JWT_ACCESS_EXPIRES_IN as string,
      issuer: 'weddingos',
      audience: 'weddingos-api',
    });
  }

  signRefreshToken(userId: string, jti: string): string {
    loadKeys();
    return jwt.sign({ sub: userId, jti }, privateKey, {
      algorithm: 'RS256',
      expiresIn: config.JWT_REFRESH_EXPIRES_IN as string,
      issuer: 'weddingos',
      audience: 'weddingos-refresh',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload & { exp: number; iat: number } {
    loadKeys();
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'weddingos',
      audience: 'weddingos-api',
    }) as AccessTokenPayload & { exp: number; iat: number };
  }

  verifyRefreshToken(token: string): { sub: string; jti: string; exp: number } {
    loadKeys();
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'weddingos',
      audience: 'weddingos-refresh',
    }) as { sub: string; jti: string; exp: number };
  }

  getAccessTokenTtlMs(): number {
    // Parse duration string: 15m -> 900000 ms
    const str = config.JWT_ACCESS_EXPIRES_IN;
    if (str.endsWith('m')) return parseInt(str) * 60 * 1000;
    if (str.endsWith('h')) return parseInt(str) * 60 * 60 * 1000;
    if (str.endsWith('d')) return parseInt(str) * 24 * 60 * 60 * 1000;
    return 900000; // default 15m
  }
}

export const jwtService = new JwtService();
