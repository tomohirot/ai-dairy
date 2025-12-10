import { PrismaClient } from '@/app/generated/prisma'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

const prismaMock = jest.requireMock('@/lib/prisma').default as DeepMockProxy<PrismaClient>

export { prismaMock }
