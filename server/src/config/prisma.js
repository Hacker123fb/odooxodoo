import { PrismaClient } from '@prisma/client';

// Global singleton instance for Prisma Client in ES modules
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

export default prisma;
