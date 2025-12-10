/**
 * トークンリフレッシュAPIエンドポイント
 * POST /api/auth/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth/jwt';
import {
  TokenExpiredError,
  InvalidTokenError,
  AuthenticationError,
} from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    const { refresh_token } = body;

    // バリデーション
    if (!refresh_token) {
      return NextResponse.json(
        {
          error: {
            code: 'VAL_002',
            message: 'Refresh token is required',
            details: [
              {
                field: 'refresh_token',
                message: 'This field is required',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    // リフレッシュトークンを検証
    const { payload } = await verifyRefreshToken(refresh_token);

    // 新しいアクセストークンを生成
    const newAccessToken = await generateAccessToken({
      sales_id: payload.sales_id,
      role: payload.role,
      email: payload.email,
    });

    return NextResponse.json(
      {
        data: {
          access_token: newAccessToken,
          token_type: 'Bearer',
          expires_in: 3600, // 1時間（秒）
        },
        message: 'Token refreshed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_003',
            message: 'Refresh token has expired',
          },
        },
        { status: 401 }
      );
    }

    if (error instanceof InvalidTokenError) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_002',
            message: 'Invalid refresh token',
          },
        },
        { status: 401 }
      );
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_001',
            message: error.message,
          },
        },
        { status: 401 }
      );
    }

    console.error('Token refresh error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'SYS_001',
          message: 'An error occurred during token refresh',
        },
      },
      { status: 500 }
    );
  }
}
