/**
 * ログアウトAPIエンドポイント
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // エラーレスポンス
    }

    // TODO: トークンブラックリスト機能を実装する場合
    // ここでトークンをブラックリストに追加

    // ログアウト成功レスポンス
    return NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'SYS_001',
          message: 'An error occurred during logout',
        },
      },
      { status: 500 }
    );
  }
}
