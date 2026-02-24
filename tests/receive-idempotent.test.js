import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Receive Lifecycle Guard Test', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should throw if receive is called twice on same transport', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T-IDEMP-1';

    // 1️⃣ Deposit 100
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 100
    });

    // 2️⃣ Dispatch 40
    await company.dispatch('ABS_RAW', {
      toMmaCode: 'PSS_SCREENED',
      transportId,
      supplierId,
      shade,
      size,
      qty: 40
    });

    // 3️⃣ Receive 30
    await company.receive({
      transportId,
      qty: 30
    });

    // 4️⃣ Second receive should throw
    await expect(
      company.receive({
        transportId,
        qty: 10
      })
    ).rejects.toThrow('Transport already closed');

    // -----------------------------
    // 🔎 VERIFY LEDGER UNCHANGED
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany({
      where: { supplierId, shade, size }
    });

    const pssNet = ledger
      .filter(l => l.mmaCode === 'PSS_SCREENED')
      .reduce((sum, l) => sum + l.qtyDelta, 0);

    expect(pssNet).toBe(30);

    // -----------------------------
    // 🔎 VERIFY ONLY ONE RECEIVE
    // -----------------------------

    const transports = await prisma.stockTransport.findMany({
      where: { transportId, type: 'RECEIVE' }
    });

    expect(transports.length).toBe(1);

  });

});