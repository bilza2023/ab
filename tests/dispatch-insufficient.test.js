// tests/dispatch-insufficient.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Dispatch Guard Test (Insufficient Stock)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should throw if dispatch exceeds available stock', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T-INSUFFICIENT-1';

    // 1️⃣ Deposit only 10
    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 10
    });

    // 2️⃣ Try dispatch 20 → should fail
    await expect(
      company.dispatch('ABS_RAW', {
        toMmaCode: 'PSS_SCREENED',
        transportId,
        supplierId,
        shade,
        size,
        qty: 20
      })
    ).rejects.toThrow('Insufficient stock');

    // -----------------------------
    // 🔎 VERIFY NOTHING WAS WRITTEN
    // -----------------------------

    const ledger = await prisma.stockLedger.findMany();
    const transports = await prisma.stockTransport.findMany();

    expect(ledger.length).toBe(1); // only original deposit
    expect(transports.length).toBe(0);
  });

});