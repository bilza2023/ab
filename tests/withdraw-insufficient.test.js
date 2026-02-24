// tests/withdraw-insufficient.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Withdraw Guard Test (Insufficient Stock)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should throw if withdraw exceeds available stock', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';

    // 1️⃣ Deposit only 30
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 30
    });

    // 2️⃣ Try withdraw 50 → should fail
    await expect(
      company.withdraw('ABS_RAW', {
        supplierId,
        shade,
        size,
        qty: 50
      })
    ).rejects.toThrow('Insufficient stock');

    // -----------------------------
    // 🔎 VERIFY NO EXTRA LEDGER ROW
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany({
      where: { supplierId, shade, size }
    });

    // Only original deposit should exist
    expect(ledger.length).toBe(1);

    const total = ledger.reduce((sum, l) => sum + l.qtyDelta, 0);
    expect(total).toBe(30);

  });

});