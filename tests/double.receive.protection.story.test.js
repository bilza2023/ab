import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Double Receive Protection Story', () => {

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

  it('should not duplicate stock if receive is called twice', async () => {

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

    // 3️⃣ First receive (valid)
    await PSS_SCREENED.receive({
      transportId: 'T1'
    });

    // 4️⃣ Second receive (should do nothing)
    await PSS_SCREENED.receive({
      transportId: 'T1'
    });

    // 5️⃣ Assert balances
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

    // 6️⃣ Ensure no duplicate ledger credits
    const ledgerRows = await prisma.stockLedger.findMany();
    const pssCredits = ledgerRows.filter(
      r => r.mmaCode === 'PSS_SCREENED' && r.qtyDelta === 40
    );

    expect(pssCredits).toHaveLength(1);
  });

});