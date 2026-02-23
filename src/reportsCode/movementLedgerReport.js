import { eventStore } from '../infrastructure/eventStore.js';

export async function buildMovementLedgerReport(filters = {}) {

  const state = await eventStore.getState();

  let rows = state.ledger.map(row => ({
    ts: row.ts,
    mmaCode: row.mmaCode,
    supplierId: row.supplierId,
    shade: row.shade,
    size: row.size,
    qtyDelta: row.qtyDelta,
    reason: row.reason,
    transportId: row.transportId
  }));

  // Optional filters
  if (filters.mmaCode) {
    rows = rows.filter(r => r.mmaCode === filters.mmaCode);
  }

  if (filters.supplierId) {
    rows = rows.filter(r => String(r.supplierId) === String(filters.supplierId));
  }

  // Sort newest first
  rows.sort((a, b) => b.ts - a.ts);

  const totalNet = rows.reduce((sum, r) => sum + r.qtyDelta, 0);

  return {
    meta: {
      title: "Movement Ledger",
      generatedAt: new Date().toISOString(),
      filters
    },

    kpis: {
      totalRows: rows.length,
      totalNet
    },

    table: {
      columns: [
        { key: "ts", label: "Timestamp" },
        { key: "mmaCode", label: "MMA" },
        { key: "supplierId", label: "Supplier" },
        { key: "shade", label: "Shade" },
        { key: "size", label: "Size" },
        { key: "qtyDelta", label: "Qty Δ" },
        { key: "reason", label: "Reason" },
        { key: "transportId", label: "Transport" }
      ],
      rows
    }
  };
}