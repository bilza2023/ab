// tests/duplicate-transport-id.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { company } from '../src/application/company.js';

const prisma = new PrismaClient();

describe('Dispatch Guard Test (Duplicate TransportId)', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should throw if dispatch uses duplicate transportId', async () => {

    const supplierId = 1;
    const shade = 'WHITE';
    const size = 'mixed';
    const transportId = 'T-DUPLICATE-1';

    await company.deposit('ABS_RAW', {
      supplierId,
      shade,
      size,
      qty: 100
    });

    await company.dispatch('ABS_RAW', {
      toMmaCode: 'PSS_SCREENED',
      transportId,
      supplierId,
      shade,
      size,
      qty: 20
    });

    await expect(
      company.dispatch('ABS_RAW', {
        toMmaCode: 'PSS_SCREENED',
        transportId,
        supplierId,
        shade,
        size,
        qty: 10
      })
    ).rejects.toThrow('Duplicate transportId');

  });

});