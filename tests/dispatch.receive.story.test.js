import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Dispatch + Receive Story', () => {

  let ABS_RAW;
  let PSS_SCREENED;

  beforeEach(async () => {
    await prisma.stockLedger.deleteMany();
    await prisma.stockTransport.deleteMany();

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

  it('should move stock from ABS_RAW to PSS_SCREENED', async () => {

    // 1️⃣ Deposit 100 at ABS
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 100
    });

    // 2️⃣ Dispatch 40 to PSS
    await ABS_RAW.dispatch({
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T1',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 40
    });

    // 3️⃣ Receive at PSS
    await PSS_SCREENED.receive({
      transportId: 'T1'
    });

    // 4️⃣ Assert balances
    const absBalance = await ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    const pssBalance = await PSS_SCREENED.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(absBalance).toBe(60);
    expect(pssBalance).toBe(40);
  });

});