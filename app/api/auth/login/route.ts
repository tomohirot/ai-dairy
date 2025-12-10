/**
 * ログインAPIエンドポイント
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTokenPair } from '@/lib/auth/jwt';
import bcrypt from 'bcrypt';
// import { prisma } from '@/lib/prisma'; // TODO: Prisma実装後に有効化

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        {
          error: {
            code: 'VAL_002',
            message: 'Email and password are required',
            details: [
              {
                field: !email ? 'email' : 'password',
                message: 'This field is required',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: {
            code: 'VAL_004',
            message: 'Invalid email format',
            details: [
              {
                field: 'email',
                message: 'Please provide a valid email address',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    // TODO: Prisma実装後にコメント解除
    // データベースからユーザーを検索
    /*
    const user = await prisma.salesPerson.findUnique({
      where: {
        email,
        isDeleted: false,
      },
      select: {
        salesId: true,
        salesName: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_001',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // パスワードを検証
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_001',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // JWTトークンペアを生成
    const { accessToken, refreshToken } = await generateTokenPair({
      sales_id: user.salesId,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json(
      {
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 3600, // 1時間（秒）
          user: {
            sales_id: user.salesId,
            sales_name: user.salesName,
            email: user.email,
            role: user.role,
          },
        },
        message: 'Login successful',
      },
      { status: 200 }
    );
    */

    // TODO: 仮実装（Prisma実装まで）
    // デモ用のハードコードされたユーザー
    const demoUser = {
      salesId: 1,
      salesName: '田中太郎',
      email: 'tanaka@example.com',
      password: await bcrypt.hash('Test1234!', 10), // ハッシュ化されたパスワード
      role: 'sales' as const,
    };

    // デモ: メールアドレスチェック
    if (email !== demoUser.email) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_001',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // デモ: パスワードチェック
    const isPasswordValid = await bcrypt.compare(password, demoUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_001',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // JWTトークンペアを生成
    const { accessToken, refreshToken } = await generateTokenPair({
      sales_id: demoUser.salesId,
      role: demoUser.role,
      email: demoUser.email,
    });

    return NextResponse.json(
      {
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            sales_id: demoUser.salesId,
            sales_name: demoUser.salesName,
            email: demoUser.email,
            role: demoUser.role,
          },
        },
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'SYS_001',
          message: 'An error occurred during login',
        },
      },
      { status: 500 }
    );
  }
}
