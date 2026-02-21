import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Cancel Transport Story', () => {

  let ABS_RAW;
  let PSS_SCREENED;

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);

    ABS_RAW = new MMA({
      code: 'ABS_RAW',
      stationCode: 'ABS',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });

    PSS_SCREENED = new MMA({
      code: 'PSS_SCREENED',
      stationCode: 'PSS',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });
  });

  it('should restore stock if transport is cancelled (append-only)', async () => {

    // 1️⃣ Deposit 100 at ABS
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 100
    });

    // 2️⃣ Dispatch 40
    await ABS_RAW.dispatch({
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T1',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 40
    });

    // 3️⃣ Cancel before receive
    await ABS_RAW.cancel({
      transportId: 'T1'
    });

    // 4️⃣ Source stock restored
    const absBalance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(absBalance).toBe(100);

    // 5️⃣ Destination still zero
    const pssBalance = await PSS_SCREENED.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(pssBalance).toBe(0);

    // 6️⃣ Transport history remains (event-sourcing principle)
    const transportRows = await prisma.stockTransport.findMany();
    expect(transportRows.length).toBeGreaterThan(0);
  });

});