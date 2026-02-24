// src/application/company.js

import { StockEngine } from './StockEngine.js';
import { eventStore } from '../infrastructure/eventStore.js';
import { appData } from './appData.js';

// ----------------------------------
// Helpers
// ----------------------------------

function requireValidMma(code) {
  const all = appData.mmaList();
  if (!all.includes(code)) {
    throw new Error(`Invalid MMA code: ${code}`);
  }
}

function now() {
  return Date.now();
}

// ----------------------------------
// Application Facade
// ----------------------------------

export const company = {

  // ----- Meta -----

  getAllMmaCodes() {
    return appData.mmaList();
  },

  // ----- Deposit -----

  async deposit(mmaCode, data) {
    requireValidMma(mmaCode);

    const state = await eventStore.getState();

    const events = StockEngine.deposit(state, {
      toMmaCode: mmaCode,
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty),
      ts: now()
    });

    await eventStore.persist(events);
    return events;
  },

  // ----- Withdraw -----

  async withdraw(mmaCode, data) {
    requireValidMma(mmaCode);

    const state = await eventStore.getState();

    const events = StockEngine.withdraw(state, {
      fromMmaCode: mmaCode,
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty),
      ts: now()
    });

    await eventStore.persist(events);
    return events;
  },

  // ----- Dispatch -----

  async dispatch(mmaCode, data) {
    requireValidMma(mmaCode);
    requireValidMma(data.toMmaCode);

    const state = await eventStore.getState();

    const events = StockEngine.dispatch(state, {
      transportId: data.transportId,
      transportNumber: data.transportNumber || null,
      fromMmaCode: mmaCode,
      toMmaCode: data.toMmaCode,
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty),
      ts: now()
    });

    await eventStore.persist(events);
    return events;
  },

  // ----- Receive -----

  async receive(data) {
    const state = await eventStore.getState();

    const events = StockEngine.receive(state, {
      transportId: data.transportId,
      qty: Number(data.qty),
      ts: now()
    });

    await eventStore.persist(events);
    return events;
  },

  // ----- Cancel -----

  async cancel(data) {
    const state = await eventStore.getState();

    const events = StockEngine.cancel(state, {
      transportId: data.transportId,
      ts: now()
    });

    if (events.length > 0) {
      await eventStore.persist(events);
    }

    return events;
  }

};