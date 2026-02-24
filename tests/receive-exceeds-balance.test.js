// tests/receive-exceeds-balance.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Receive Guard Test (Exceeds Pending Balance)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should throw if receive qty exceeds pending transport balance', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T-EXCEED-1';

    // 1️⃣ Deposit 50
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 50
    });

    // 2️⃣ Dispatch 20
    await company.dispatch('ABS_RAW', {
      toMmaCode: 'PSS_SCREENED',
      transportId,
      supplierId,
      shade,
      size,
      qty: 20
    });

    // 3️⃣ Try to receive 25 (exceeds 20)
    await expect(
      company.receive({
        transportId,
        qty: 25
      })
    ).rejects.toThrow('Receive exceeds pending qty');

    // -----------------------------
    // 🔎 VERIFY NOTHING WAS RECEIVED
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany({
      where: { supplierId, shade, size }
    });

    const pssNet = ledger
      .filter(l => l.mmaCode === 'PSS_SCREENED')
      .reduce((sum, l) => sum + l.qtyDelta, 0);

    expect(pssNet).toBe(0);

    const receiveEvents = await prisma.stockTransport.findMany({
      where: { transportId, type: 'RECEIVE' }
    });

    expect(receiveEvents.length).toBe(0);
  });

});