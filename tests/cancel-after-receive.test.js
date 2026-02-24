// tests/cancel-after-receive.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Cancel Guard Test (After Receive)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should throw if cancel is called after receive', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T-CANCEL-GUARD';

    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 50
    });

    await company.dispatch('ABS_RAW', {
      toMmaCode: 'PSS_SCREENED',
      transportId,
      supplierId,
      shade,
      size,
      qty: 20
    });

    await company.receive({
      transportId,
      qty: 10
    });

    await expect(
      company.cancel({ transportId })
    ).rejects.toThrow('Transport already closed');

  });

});