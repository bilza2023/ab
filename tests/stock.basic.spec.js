import { describe, it, expect, beforeEach } from 'vitest';
import { CompanyStructure } from '../src/core/company.js';
import { MMA } from '../src/core/MMA.js';
import { memoryStore } from '../src/core/memoryStore.js';

describe('Basic Stock Flow', () => {

  let ABS_RAW;
  let PSS_SCREENED;

  beforeEach(() => {
    // Reset memory
    memoryStore.state.ledger = [];
    memoryStore.state.transport = [];

    // Setup company
    const company = new CompanyStructure();
    company.addStation('ABS', 'Abs Plant');
    company.addStation('PSS', 'Pss Plant');

    // Setup MMAs
    ABS_RAW = new MMA({
      code: 'ABS_RAW',
      stationCode: 'ABS',
      getState: () => memoryStore.getState(),
      persistEvents: (events) => memoryStore.persist(events)
    });

    PSS_SCREENED = new MMA({
      code: 'PSS_SCREENED',
      stationCode: 'PSS',
      getState: () => memoryStore.getState(),
      persistEvents: (events) => memoryStore.persist(events)
    });
  });

  it('should deposit, dispatch and receive correctly', () => {

    ABS_RAW.deposit({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 100
    });

    ABS_RAW.dispatch({
      toMmaCode: 'PSS_SCREENED',
      transportId: 'T1',
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed',
      qty: 40
    });

    PSS_SCREENED.receive({ transportId: 'T1' });

    const absBalance = ABS_RAW.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    const pssBalance = PSS_SCREENED.onHand({
      supplierId: 1,
      shade: 'WHITE',
      size: 'mixed'
    });

    expect(absBalance).toBe(60);
    expect(pssBalance).toBe(40);
  });

});