import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Multi Supplier Isolation Story', () => {

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

  it('should isolate stock by supplier', async () => {

    // 1️⃣ Supplier 1 deposits 100
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 100
    });

    // 2️⃣ Supplier 2 deposits 50
    await ABS_RAW.deposit({
      supplierId: 2,
      shade: 'WHITE',
      size: 'mixed',
      qty: 50
    });

    // 3️⃣ Dispatch 40 only from supplier 1
    await ABS_RAW.dispatch({
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T1',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 40
    });

    await PSS_SCREENED.receive({ transportId: 'T1' });

    // 4️⃣ Check balances
    const supplier1Balance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    const supplier2Balance = await ABS_RAW.onHand({
      supplierId: 2,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(supplier1Balance).toBe(60);
    expect(supplier2Balance).toBe(50);
  });

});