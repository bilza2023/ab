import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Cancel Mid Chain Story', () => {

  let ABS_RAW;
  let PSS_SCREENED;
  let KEF_FINAL;

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

    KEF_FINAL = new MMA({
      code: 'KEF_FINAL',
      stationCode: 'KEF',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });
  });

  it('should restore stock correctly when cancelling second leg', async () => {

    // 1️⃣ Deposit 200
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 200
    });

    // 2️⃣ ABS → PSS (80)
    await ABS_RAW.dispatch({
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T1',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 80
    });

    await PSS_SCREENED.receive({ transportId: 'T1' });

    // 3️⃣ PSS → KEF (50)
    await PSS_SCREENED.dispatch({
      toMmaCode: 'KEF_FINAL',
      transportId: 'T2',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 50
    });

    // ❌ Cancel second leg before receive
    await PSS_SCREENED.cancel({ transportId: 'T2' });

    // 4️⃣ Check balances
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

    const kefBalance = await KEF_FINAL.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(absBalance).toBe(120); // 200 - 80
    expect(pssBalance).toBe(80);  // got 80, dispatched 50, cancelled → back to 80
    expect(kefBalance).toBe(0);   // never received
  });

});