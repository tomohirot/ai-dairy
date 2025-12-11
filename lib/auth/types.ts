/**
 * 認証関連の型定義
 */

/**
 * JWTペイロード
 */
export interface JWTPayload {
  sales_id: number;
  role: 'sales' | 'manager' | 'admin';
  email: string;
  iat?: number; // Issued At
  exp?: number; // Expiration Time
}

/**
 * アクセストークンペイロード
 */
export interface AccessTokenPayload extends JWTPayload {
  type: 'access';
}

/**
 * リフレッシュトークンペイロード
 */
export interface RefreshTokenPayload extends JWTPayload {
  type: 'refresh';
}

/**
 * トークンペア
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * 検証済みトークン
 */
export interface VerifiedToken {
  payload: JWTPayload;
  header: Record<string, unknown>;
}

/**
 * 認証エラー
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * トークン期限切れエラー
 */
export class TokenExpiredError extends Error {
  constructor(message: string = 'Token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * 無効なトークンエラー
 */
export class InvalidTokenError extends Error {
  constructor(message: string = 'Invalid token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

/**
 * 権限不足エラー
 */
export class InsufficientPermissionsError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * オーナーシップエラー
 */
export class OwnershipError extends Error {
  constructor(message: string = 'You do not have ownership of this resource') {
    super(message);
    this.name = 'OwnershipError';
  }
}
