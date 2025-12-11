/**
 * 認証ミドルウェア
 * Next.js App Router用のミドルウェア関数
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import {
  JWTPayload,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  InsufficientPermissionsError,
  OwnershipError,
} from './types';
import { prisma } from '@/lib/prisma';

/**
 * リクエストからBearerトークンを抽出
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 認証が必要なAPIエンドポイント用のミドルウェア
 *
 * 使用例:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request);
 *   if (authResult instanceof NextResponse) {
 *     return authResult; // エラーレスポンス
 *   }
 *
 *   const { payload } = authResult;
 *   // 認証成功、payload.sales_id などを使用
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ payload: JWTPayload } | NextResponse> {
  try {
    // Bearerトークンを抽出
    const token = extractBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_001',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // トークンを検証
    const verified = await verifyAccessToken(token);

    return { payload: verified.payload };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_003',
            message: 'Token has expired',
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
            message: 'Invalid token',
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

    // その他のエラー
    return NextResponse.json(
      {
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * ロール別の権限チェック
 *
 * @param payload - JWT payload
 * @param allowedRoles - 許可するロールの配列
 * @returns 権限がある場合はtrue
 */
export function checkRole(
  payload: JWTPayload,
  allowedRoles: Array<'sales' | 'manager' | 'admin'>
): boolean {
  return allowedRoles.includes(payload.role);
}

/**
 * ロールチェック付き認証ミドルウェア
 *
 * @param request - Next.js request
 * @param allowedRoles - 許可するロール
 */
export async function requireAuthWithRole(
  request: NextRequest,
  allowedRoles: Array<'sales' | 'manager' | 'admin'>
): Promise<{ payload: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // エラーレスポンス
  }

  const { payload } = authResult;

  // ロールチェック
  if (!checkRole(payload, allowedRoles)) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_004',
          message: 'Insufficient permissions',
        },
      },
      { status: 403 }
    );
  }

  return { payload };
}

/**
 * オーナーシップチェック
 * リソースが本人のものかをチェック
 *
 * @param payload - JWT payload
 * @param resourceOwnerId - リソースの所有者ID
 * @returns 本人または管理者の場合はtrue
 */
export function checkOwnership(
  payload: JWTPayload,
  resourceOwnerId: number
): boolean {
  // 管理者は全てのリソースにアクセス可能
  if (payload.role === 'admin') {
    return true;
  }

  // 本人のリソースかチェック
  return payload.sales_id === resourceOwnerId;
}

/**
 * オプショナル認証（トークンがあれば検証、なくてもOK）
 * 一部の機能で使用
 */
export async function optionalAuth(
  request: NextRequest
): Promise<{ payload: JWTPayload | null }> {
  try {
    const token = extractBearerToken(request);

    if (!token) {
      return { payload: null };
    }

    const verified = await verifyAccessToken(token);
    return { payload: verified.payload };
  } catch {
    // エラーが発生しても、認証なしとして扱う
    return { payload: null };
  }
}

/**
 * ロール別権限チェックミドルウェア（簡易版）
 *
 * 使用例:
 * ```typescript
 * export async function DELETE(request: NextRequest) {
 *   const authResult = await requireRole(request, ['admin']);
 *   if (authResult instanceof NextResponse) {
 *     return authResult;
 *   }
 *   const { payload } = authResult;
 *   // 管理者のみアクセス可能
 * }
 * ```
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Array<'sales' | 'manager' | 'admin'>
): Promise<{ payload: JWTPayload } | NextResponse> {
  return requireAuthWithRole(request, allowedRoles);
}

/**
 * オーナーシップチェックミドルウェア
 * リソースの所有者または管理者のみアクセスを許可
 *
 * @param request - Next.js request
 * @param resourceOwnerId - リソースの所有者ID
 *
 * 使用例:
 * ```typescript
 * export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
 *   // 日報の所有者を取得
 *   const report = await prisma.dailyReport.findUnique({ where: { id: parseInt(params.id) } });
 *
 *   const authResult = await requireOwnership(request, report.salesId);
 *   if (authResult instanceof NextResponse) {
 *     return authResult;
 *   }
 *   // 本人または管理者のみアクセス可能
 * }
 * ```
 */
export async function requireOwnership(
  request: NextRequest,
  resourceOwnerId: number
): Promise<{ payload: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { payload } = authResult;

  // オーナーシップチェック
  if (!checkOwnership(payload, resourceOwnerId)) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_004',
          message: 'You do not have ownership of this resource',
        },
      },
      { status: 403 }
    );
  }

  return { payload };
}

/**
 * 上長-部下関係チェック
 *
 * @param managerId - 上長ID
 * @param subordinateId - 部下ID
 * @returns 上長-部下関係がある場合はtrue
 */
export async function isManagerOf(
  managerId: number,
  subordinateId: number
): Promise<boolean> {
  try {
    // 部下のレコードを取得し、managerIdをチェック
    const subordinate = await prisma.salesPerson.findUnique({
      where: { id: subordinateId },
      select: { managerId: true },
    });

    if (!subordinate) {
      return false;
    }

    return subordinate.managerId === managerId;
  } catch {
    return false;
  }
}

/**
 * 上長権限チェックミドルウェア
 * 指定された営業担当者の上長、または管理者のみアクセスを許可
 *
 * @param request - Next.js request
 * @param subordinateId - 部下の営業ID
 *
 * 使用例:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   // 日報の作成者IDを取得
 *   const { sales_id } = await request.json();
 *
 *   const authResult = await requireManagerOf(request, sales_id);
 *   if (authResult instanceof NextResponse) {
 *     return authResult;
 *   }
 *   // 該当営業の上長または管理者のみコメント可能
 * }
 * ```
 */
export async function requireManagerOf(
  request: NextRequest,
  subordinateId: number
): Promise<{ payload: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { payload } = authResult;

  // 管理者は全てアクセス可能
  if (payload.role === 'admin') {
    return { payload };
  }

  // 上長権限チェック
  const isManager = await isManagerOf(payload.sales_id, subordinateId);

  if (!isManager) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_004',
          message: 'You are not the manager of this salesperson',
        },
      },
      { status: 403 }
    );
  }

  return { payload };
}
