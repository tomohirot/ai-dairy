/**
 * 認証ミドルウェアのテスト
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import {
  requireAuth,
  requireRole,
  requireOwnership,
  requireManagerOf,
  checkRole,
  checkOwnership,
  isManagerOf,
} from '@/lib/auth/middleware';
import { JWTPayload, InvalidTokenError, TokenExpiredError } from '@/lib/auth/types';
import { prismaMock } from '@/__tests__/utils/prisma-mock';

// JWTモジュールをモック
jest.mock('@/lib/auth/jwt', () => ({
  generateAccessToken: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

import { verifyAccessToken } from '@/lib/auth/jwt';

// モックリクエストヘルパー
const createMockRequest = (token?: string): NextRequest => {
  const headers = new Headers();
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const request = new NextRequest('http://localhost:3000/api/test', {
    headers,
  });

  return request;
};

describe('認証ミドルウェア', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('有効なトークンで認証成功', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'test@example.com',
      };

      const mockToken = 'valid-token';
      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest(mockToken);

      const result = await requireAuth(request);

      expect(result).toHaveProperty('payload');
      if ('payload' in result) {
        expect(result.payload.sales_id).toBe(1);
        expect(result.payload.role).toBe('sales');
        expect(result.payload.email).toBe('test@example.com');
      }
    });

    it('トークンなしで401エラー', async () => {
      const request = createMockRequest();
      const result = await requireAuth(request);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(401);
        const body = await result.json();
        expect(body.error.code).toBe('AUTH_001');
      }
    });

    it('無効なトークンで401エラー', async () => {
      (verifyAccessToken as jest.Mock).mockRejectedValue(
        new InvalidTokenError('Invalid token')
      );

      const request = createMockRequest('invalid-token');
      const result = await requireAuth(request);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(401);
        const body = await result.json();
        expect(body.error.code).toBe('AUTH_002');
      }
    });

    it('期限切れトークンで401エラー', async () => {
      (verifyAccessToken as jest.Mock).mockRejectedValue(
        new TokenExpiredError()
      );

      const request = createMockRequest('expired-token');
      const result = await requireAuth(request);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(401);
        const body = await result.json();
        expect(body.error.code).toBe('AUTH_003');
      }
    });
  });

  describe('checkRole', () => {
    it('許可されたロールでtrue', () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'manager',
        email: 'test@example.com',
      };

      expect(checkRole(payload, ['manager', 'admin'])).toBe(true);
    });

    it('許可されていないロールでfalse', () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'test@example.com',
      };

      expect(checkRole(payload, ['manager', 'admin'])).toBe(false);
    });

    it('管理者は全てのロール制限をパスする', () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'admin',
        email: 'admin@example.com',
      };

      expect(checkRole(payload, ['admin'])).toBe(true);
      expect(checkRole(payload, ['manager', 'admin'])).toBe(true);
    });
  });

  describe('requireRole', () => {
    it('許可されたロールでアクセス成功', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'manager',
        email: 'manager@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest('valid-token');

      const result = await requireRole(request, ['manager', 'admin']);

      expect(result).toHaveProperty('payload');
      if ('payload' in result) {
        expect(result.payload.role).toBe('manager');
      }
    });

    it('許可されていないロールで403エラー', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'sales@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest('valid-token');

      const result = await requireRole(request, ['manager', 'admin']);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(403);
        const body = await result.json();
        expect(body.error.code).toBe('AUTH_004');
      }
    });
  });

  describe('checkOwnership', () => {
    it('本人のリソースでtrue', () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'test@example.com',
      };

      expect(checkOwnership(payload, 1)).toBe(true);
    });

    it('他人のリソースでfalse', () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'test@example.com',
      };

      expect(checkOwnership(payload, 2)).toBe(false);
    });

    it('管理者は他人のリソースでもtrue', () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'admin',
        email: 'admin@example.com',
      };

      expect(checkOwnership(payload, 999)).toBe(true);
    });
  });

  describe('requireOwnership', () => {
    it('本人のリソースでアクセス成功', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'test@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest('valid-token');

      const result = await requireOwnership(request, 1);

      expect(result).toHaveProperty('payload');
    });

    it('他人のリソースで403エラー', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'test@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest('valid-token');

      const result = await requireOwnership(request, 2);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(403);
        const body = await result.json();
        expect(body.error.code).toBe('AUTH_004');
      }
    });

    it('管理者は他人のリソースでもアクセス成功', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'admin',
        email: 'admin@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest('valid-token');

      const result = await requireOwnership(request, 999);

      expect(result).toHaveProperty('payload');
    });
  });

  describe('isManagerOf', () => {
    it('上長-部下関係がある場合はtrue', async () => {
      prismaMock.salesPerson.findUnique.mockResolvedValue({
        id: 2,
        name: '部下',
        nameKana: 'ブカ',
        email: 'subordinate@example.com',
        department: '営業1課',
        managerId: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isManagerOf(1, 2);
      expect(result).toBe(true);
    });

    it('上長-部下関係がない場合はfalse', async () => {
      prismaMock.salesPerson.findUnique.mockResolvedValue({
        id: 2,
        name: '営業',
        nameKana: 'エイギョウ',
        email: 'sales@example.com',
        department: '営業1課',
        managerId: 3,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await isManagerOf(1, 2);
      expect(result).toBe(false);
    });

    it('部下が存在しない場合はfalse', async () => {
      prismaMock.salesPerson.findUnique.mockResolvedValue(null);

      const result = await isManagerOf(1, 999);
      expect(result).toBe(false);
    });

    it('データベースエラーでfalse', async () => {
      prismaMock.salesPerson.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const result = await isManagerOf(1, 2);
      expect(result).toBe(false);
    });
  });

  describe('requireManagerOf', () => {
    it('上長でアクセス成功', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'manager',
        email: 'manager@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      prismaMock.salesPerson.findUnique.mockResolvedValue({
        id: 2,
        name: '部下',
        nameKana: 'ブカ',
        email: 'subordinate@example.com',
        department: '営業1課',
        managerId: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest('valid-token');

      const result = await requireManagerOf(request, 2);

      expect(result).toHaveProperty('payload');
    });

    it('上長でない場合は403エラー', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'manager',
        email: 'manager@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      prismaMock.salesPerson.findUnique.mockResolvedValue({
        id: 2,
        name: '営業',
        nameKana: 'エイギョウ',
        email: 'sales@example.com',
        department: '営業1課',
        managerId: 3,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest('valid-token');

      const result = await requireManagerOf(request, 2);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(403);
        const body = await result.json();
        expect(body.error.code).toBe('AUTH_004');
      }
    });

    it('管理者は上長でなくてもアクセス成功', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'admin',
        email: 'admin@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      const request = createMockRequest('valid-token');

      const result = await requireManagerOf(request, 999);

      expect(result).toHaveProperty('payload');
    });

    it('一般営業は上長権限なしで403エラー', async () => {
      const payload: JWTPayload = {
        sales_id: 1,
        role: 'sales',
        email: 'sales@example.com',
      };

      (verifyAccessToken as jest.Mock).mockResolvedValue({
        payload,
        header: {},
      });

      prismaMock.salesPerson.findUnique.mockResolvedValue({
        id: 2,
        name: '営業',
        nameKana: 'エイギョウ',
        email: 'sales2@example.com',
        department: '営業1課',
        managerId: 3,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest('valid-token');

      const result = await requireManagerOf(request, 2);

      expect(result).toHaveProperty('status');
      if ('status' in result) {
        expect(result.status).toBe(403);
      }
    });
  });
});
