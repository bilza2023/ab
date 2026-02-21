import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Multi Shade Isolation Story', () => {

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

  it('should isolate stock by shade', async () => {

    // 1️⃣ Deposit WHITE 100
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 100
    });

    // 2️⃣ Deposit RED 80
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'RED',
      size: 'mixed',
      qty: 80
    });

    // 3️⃣ Dispatch 40 WHITE
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
    const whiteBalance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    const redBalance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'RED',
      size: 'mixed'
    });

    expect(whiteBalance).toBe(60);
    expect(redBalance).toBe(80);
  });

});