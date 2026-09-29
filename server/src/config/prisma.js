let prisma = null;

try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
} catch (e) {
  // Graceful fallback if @prisma/client has not been generated yet
  prisma = null;
}

export default prisma;
