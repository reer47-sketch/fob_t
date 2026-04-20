import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ]
    : ['error'],
})

// 쿼리 로그를 보기 좋게 포맷팅 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log('\n🔍 Query:', e.query)
    console.log('⏱️  Duration:', e.duration + 'ms')
    if (e.params !== '[]') {
      console.log('📝 Params:', e.params)
    }
    console.log('---')
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
