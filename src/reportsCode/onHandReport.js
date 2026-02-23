import { eventStore } from '../infrastructure/eventStore.js';

export async function buildOnHandReport() {

  const state = await eventStore.getState();

  const bucketMap = new Map();

  for (const row of state.ledger) {

    const key = [
      row.mmaCode,
      row.supplierId,
      row.shade,
      row.size
    ].join('|');

    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        mmaCode: row.mmaCode,
        supplierId: row.supplierId,
        shade: row.shade,
        size: row.size,
        qty: 0
      });
    }

    bucketMap.get(key).qty += row.qtyDelta;
  }

  // Remove zero balances
  const rows = Array.from(bucketMap.values())
    .filter(r => r.qty !== 0)
    .sort((a, b) => {
      if (a.mmaCode !== b.mmaCode)
        return a.mmaCode.localeCompare(b.mmaCode);
      return b.qty - a.qty;
    });

  const totalQty = rows.reduce((sum, r) => sum + r.qty, 0);

  return {
    meta: {
      title: "On-Hand Report",
      generatedAt: new Date().toISOString(),
      mmaCode: null
    },

    kpis: {
      totalQty,
      totalSlots: rows.length
    },

    table: {
      columns: [
        { key: "mmaCode", label: "MMA" },
        { key: "supplierId", label: "Supplier" },
        { key: "shade", label: "Shade" },
        { key: "size", label: "Size" },
        { key: "qty", label: "Qty" }
      ],
      rows
    }
  };
}