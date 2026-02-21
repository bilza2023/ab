import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Deposit Only', () => {

  let ABS_RAW;

  beforeEach(async () => {
    await prisma.stockLedger.deleteMany();
    await prisma.stockTransport.deleteMany();

    ABS_RAW = new MMA({
      code: 'ABS_RAW',
      stationCode: 'ABS',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });
  });

  it('should deposit 100', async () => {

    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 100
    });

    const rows = await prisma.stockLedger.findMany();

    const balance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(rows).toHaveLength(1);
    expect(balance).toBe(100);
  });

});