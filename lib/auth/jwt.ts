/**
 * JWT生成・検証機能
 * JOSEライブラリを使用した実装
 */

import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose';
import {
  JWTPayload,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  VerifiedToken,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
} from './types';

// 環境変数から秘密鍵を取得
const getSecretKey = (type: 'access' | 'refresh'): Uint8Array => {
  const secret =
    type === 'access'
      ? process.env.JWT_SECRET
      : process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error(
      `${type === 'access' ? 'JWT_SECRET' : 'JWT_REFRESH_SECRET'} is not defined in environment variables`
    );
  }

  return new TextEncoder().encode(secret);
};

// トークン有効期限
const ACCESS_TOKEN_EXPIRES_IN = '1h'; // 1時間
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7日

/**
 * アクセストークンを生成
 */
export async function generateAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<string> {
  const secret = getSecretKey('access');

  const accessTokenPayload: AccessTokenPayload = {
    ...payload,
    type: 'access',
  };

  const token = await new SignJWT(accessTokenPayload as unknown as JoseJWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(secret);

  return token;
}

/**
 * リフレッシュトークンを生成
 */
export async function generateRefreshToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<string> {
  const secret = getSecretKey('refresh');

  const refreshTokenPayload: RefreshTokenPayload = {
    ...payload,
    type: 'refresh',
  };

  const token = await new SignJWT(refreshTokenPayload as unknown as JoseJWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(secret);

  return token;
}

/**
 * トークンペアを生成（アクセストークン + リフレッシュトークン）
 */
export async function generateTokenPair(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * アクセストークンを検証
 */
export async function verifyAccessToken(
  token: string
): Promise<VerifiedToken> {
  try {
    const secret = getSecretKey('access');

    const { payload, protectedHeader } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // typeがaccessであることを確認
    const typedPayload = payload as unknown as AccessTokenPayload;
    if (typedPayload.type !== 'access') {
      throw new InvalidTokenError('Invalid token type');
    }

    return {
      payload: typedPayload as JWTPayload,
      header: protectedHeader,
    };
  } catch (error) {
    if (error instanceof Error) {
      // JOSEライブラリのエラーを適切なカスタムエラーに変換
      if (error.message.includes('expired')) {
        throw new TokenExpiredError();
      }
      if (
        error.message.includes('signature') ||
        error.message.includes('invalid')
      ) {
        throw new InvalidTokenError(error.message);
      }
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * リフレッシュトークンを検証
 */
export async function verifyRefreshToken(
  token: string
): Promise<VerifiedToken> {
  try {
    const secret = getSecretKey('refresh');

    const { payload, protectedHeader } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // typeがrefreshであることを確認
    const typedPayload = payload as unknown as RefreshTokenPayload;
    if (typedPayload.type !== 'refresh') {
      throw new InvalidTokenError('Invalid token type');
    }

    return {
      payload: typedPayload as JWTPayload,
      header: protectedHeader,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new TokenExpiredError('Refresh token has expired');
      }
      if (
        error.message.includes('signature') ||
        error.message.includes('invalid')
      ) {
        throw new InvalidTokenError(error.message);
      }
    }
    throw new AuthenticationError('Refresh token verification failed');
  }
}

/**
 * トークンからペイロードをデコード（検証なし）
 * デバッグ・ログ用途のみ使用すること
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
    return payload as JWTPayload;
  } catch {
    return null;
  }
}
