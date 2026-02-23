import { eventStore } from '../infrastructure/eventStore.js';

export async function buildSupplierReport() {

  const state = await eventStore.getState();

  const supplierMap = new Map();

  for (const row of state.ledger) {

    const supplierId = row.supplierId;

    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        supplierId,
        slots: new Map()
      });
    }

    const supplierBucket = supplierMap.get(supplierId);

    const slotKey = [
      row.mmaCode,
      row.shade,
      row.size
    ].join('|');

    if (!supplierBucket.slots.has(slotKey)) {
      supplierBucket.slots.set(slotKey, {
        mmaCode: row.mmaCode,
        shade: row.shade,
        size: row.size,
        qty: 0
      });
    }

    supplierBucket.slots.get(slotKey).qty += row.qtyDelta;
  }

  const supplierSections = [];

  for (const supplier of supplierMap.values()) {

    const slots = Array.from(supplier.slots.values())
      .filter(s => s.qty !== 0)
      .sort((a, b) => b.qty - a.qty);

    const totalQty = slots.reduce((sum, s) => sum + s.qty, 0);

    supplierSections.push({
      supplierId: supplier.supplierId,
      totalQty,
      totalSlots: slots.length,
      slots
    });
  }

  supplierSections.sort((a, b) => b.totalQty - a.totalQty);

  return {
    meta: {
      title: "Supplier Report",
      generatedAt: new Date().toISOString()
    },

    kpis: {
      totalSuppliers: supplierSections.length
    },

    sections: supplierSections
  };
}