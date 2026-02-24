// tests/mass-conservation.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('System Invariant Test (Mass Conservation)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should preserve total system stock across complex operations', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';

    // 1️⃣ Deposit 200
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 200
    });

    // 2️⃣ Dispatch 50
    await company.dispatch('ABS_RAW', {
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T-A',
      supplierId,
      shade,
      size,
      qty: 50
    });

    // 3️⃣ Receive 30
    await company.receive({
      transportId: 'T-A',
      qty: 30
    });

    // 4️⃣ Dispatch another 40
    await company.dispatch('ABS_RAW', {
      toMmaCode: 'KEF_SORTED',
      transportId: 'T-B',
      supplierId,
      shade,
      size,
      qty: 40
    });

    // 5️⃣ Cancel second transport
    await company.cancel({ transportId: 'T-B' });

    // 6️⃣ Withdraw 20 (simulate process consumption)
    await company.withdraw('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 20
    });

    // -----------------------------
    // 🔎 VERIFY TOTAL SYSTEM MASS
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany({
      where: { supplierId, shade, size }
    });

    const totalSystem = ledger.reduce((sum, l) => sum + l.qtyDelta, 0);

    // Expected:
    // +200 deposit
    // -50 dispatch
    // +30 receive
    // -40 dispatch
    // +40 cancel restore
    // -20 withdraw
    //
    // = 200 - 50 + 30 - 40 + 40 - 20
    // = 160

    expect(totalSystem).toBe(160);

  });

});