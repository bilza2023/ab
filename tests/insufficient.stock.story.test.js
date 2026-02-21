import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Insufficient Stock Story', () => {

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

  it('should throw if dispatching more than available', async () => {

    // 1️⃣ Deposit only 10
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 10
    });

    // 2️⃣ Attempt to dispatch 50 (should fail)
    await expect(
      ABS_RAW.dispatch({
        toMmaCode: 'PSS_SCREENED',
        transportId: 'T1',
        supplierId: 1,
        shade: 'WHITE',
        size: 'mixed',
        qty: 50
      })
    ).rejects.toThrow();

    // 3️⃣ Ensure stock remains unchanged
    const balance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(balance).toBe(10);

    // 4️⃣ Ensure no transport rows were created
    const transportRows = await prisma.stockTransport.findMany();
    expect(transportRows).toHaveLength(0);
  });

});