import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MMA } from '../src/mma/MMA.js';
import { eventStore } from '../src/infrastructure/eventStore.js';

const prisma = new PrismaClient();

describe('Replay From DB Story', () => {

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.stockTransport.deleteMany(),
      prisma.stockLedger.deleteMany()
    ]);
  });

  it('should rebuild correct balances from DB events only', async () => {

    // --- First lifecycle (simulate normal operations) ---

    let ABS_RAW = new MMA({
      code: 'ABS_RAW',
      stationCode: 'ABS',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });

    let PSS_SCREENED = new MMA({
      code: 'PSS_SCREENED',
      stationCode: 'PSS',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });

    let KEF_FINAL = new MMA({
      code: 'KEF_FINAL',
      stationCode: 'KEF',
      getState: () => eventStore.getState(),
      persistEvents: (events) => eventStore.persist(events)
    });

    // 1️⃣ Deposit 300
    await ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 300
    });

    // 2️⃣ ABS → PSS (120)
    await ABS_RAW.dispatch({
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T1',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 120
    });

    await PSS_SCREENED.receive({ transportId: 'T1' });

    // 3️⃣ PSS → KEF (70)
    await PSS_SCREENED.dispatch({
      toMmaCode: 'KEF_FINAL',
      transportId: 'T2',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 70
    });

    await KEF_FINAL.receive({ transportId: 'T2' });

    // --- Destroy instances (simulate app restart) ---
    ABS_RAW = null;
    PSS_SCREENED = null;
    KEF_FINAL = null;

    // --- Recreate fresh instances (pure replay from DB) ---

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

    // --- Validate reconstructed balances ---

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

    expect(absBalance).toBe(180); // 300 - 120
    expect(pssBalance).toBe(50);  // 120 - 70
    expect(kefBalance).toBe(70);  // received 70
  });

});