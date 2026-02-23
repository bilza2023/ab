import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function destroyAllData() {
  await prisma.$transaction([
    prisma.stockTransport.deleteMany(),
    prisma.stockLedger.deleteMany()
  ]);
}