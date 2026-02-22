import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Deposit → Dispatch → Partial Receive (DB Truth Test)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should persist correct DB state for partial receive', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T1';

    // 1️⃣ Deposit 100
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 100
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

    // 3️⃣ Partial receive 15
    await company.receive({
      transportId,
      qty: 15
    });

    // -----------------------------
    // 🔎 VERIFY LEDGER
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany({
      where: { supplierId, shade, size }
    });

    const absNet = ledger
      .filter(l => l.mmaCode === 'ABS_RAW')
      .reduce((sum, l) => sum + l.qtyDelta, 0);

    const pssNet = ledger
      .filter(l => l.mmaCode === 'PSS_SCREENED')
      .reduce((sum, l) => sum + l.qtyDelta, 0);

    expect(absNet).toBe(80);   // 100 - 20
    expect(pssNet).toBe(15);   // received 15
    expect(absNet + pssNet).toBe(95); // physical total

    // -----------------------------
    // 🔎 VERIFY TRANSPORT (event-based)
    // -----------------------------

    const transports = await prisma.stockTransport.findMany({
      where: { transportId }
    });

    expect(transports.length).toBeGreaterThan(0);

    const dispatched = transports
      .filter(t => t.type === 'DISPATCH')
      .reduce((sum, t) => sum + t.qtyDelta, 0);

    const received = transports
      .filter(t => t.type === 'RECEIVE')
      .reduce((sum, t) => sum + Math.abs(t.qtyDelta), 0);

    expect(dispatched).toBe(20);
    expect(received).toBe(15);
    expect(dispatched - received).toBe(5);
  });

});