import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Dispatch → Cancel (Stock Restoration Test)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should fully restore stock after cancel', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T-CANCEL-1';

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

    // 3️⃣ Cancel transport
    await company.cancel({ transportId });

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

    expect(absNet).toBe(50);  // fully restored
    expect(pssNet).toBe(0);   // nothing received

    // -----------------------------
    // 🔎 VERIFY TRANSPORT STATUS
    // -----------------------------

    const transports = await prisma.stockTransport.findMany({
      where: { transportId }
    });

    const cancelEvents = transports.filter(t => t.type === 'CANCEL');
    expect(cancelEvents.length).toBe(1);

  });

});