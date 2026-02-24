// tests/withdraw-exact-depletion.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Withdraw Edge Test (Exact Depletion)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should reduce stock exactly to zero when fully withdrawn', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';

    // 1️⃣ Deposit 40
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 40
    });

    // 2️⃣ Withdraw exactly 40
    await company.withdraw('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 40
    });

    // -----------------------------
    // 🔎 VERIFY ZERO BALANCE
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany({
      where: { supplierId, shade, size }
    });

    const total = ledger.reduce((sum, l) => sum + l.qtyDelta, 0);

    expect(total).toBe(0);

    // Ensure no negative rows slipped in
    const negatives = ledger.filter(l => l.qtyDelta < 0);
    expect(negatives.length).toBe(1); // exactly one withdraw row

  });

});