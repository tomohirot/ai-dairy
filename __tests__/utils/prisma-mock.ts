import { PrismaClient } from '@/app/generated/prisma'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

const prismaMock = mockDeep<PrismaClient>()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
  default: prismaMock,
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export { prismaMock }
