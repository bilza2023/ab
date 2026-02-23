import { eventStore } from '../infrastructure/eventStore.js';

export async function buildMmaReport() {

  const state = await eventStore.getState();

  const mmaMap = new Map();

  for (const row of state.ledger) {

    const key = [
      row.mmaCode,
      row.supplierId,
      row.shade,
      row.size
    ].join('|');

    if (!mmaMap.has(row.mmaCode)) {
      mmaMap.set(row.mmaCode, {
        mmaCode: row.mmaCode,
        slots: new Map()
      });
    }

    const mmaBucket = mmaMap.get(row.mmaCode);

    if (!mmaBucket.slots.has(key)) {
      mmaBucket.slots.set(key, {
        supplierId: row.supplierId,
        shade: row.shade,
        size: row.size,
        qty: 0
      });
    }

    mmaBucket.slots.get(key).qty += row.qtyDelta;
  }

  const mmaSections = [];

  for (const mma of mmaMap.values()) {

    const slots = Array.from(mma.slots.values())
      .filter(s => s.qty !== 0)
      .sort((a, b) => b.qty - a.qty);

    const totalQty = slots.reduce((sum, s) => sum + s.qty, 0);

    mmaSections.push({
      mmaCode: mma.mmaCode,
      totalQty,
      totalSlots: slots.length,
      slots
    });
  }

  mmaSections.sort((a, b) => b.totalQty - a.totalQty);

  return {
    meta: {
      title: "MMA Report",
      generatedAt: new Date().toISOString()
    },

    kpis: {
      totalMmas: mmaSections.length
    },

    sections: mmaSections
  };
}