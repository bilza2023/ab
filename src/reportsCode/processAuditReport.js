
import { eventStore } from '../infrastructure/eventStore.js';

export async function buildProcessAuditReport({ processId }) {

  if (!processId) {
    throw new Error('processId is required');
  }

  const state = await eventStore.getState();

  const rows = state.ledger
    .filter(row => row.meta && row.meta.processId === processId)
    .map(row => ({
      ts: row.ts,
      mmaCode: row.mmaCode,
      supplierId: row.supplierId,
      shade: row.shade,
      size: row.size,
      qtyDelta: row.qtyDelta,
      reason: row.reason
    }))
    .sort((a, b) => a.ts - b.ts); // chronological

  const totalNet = rows.reduce((sum, r) => sum + r.qtyDelta, 0);

  return {
    meta: {
      title: `Process Audit: ${processId}`,
      generatedAt: new Date().toISOString(),
      processId
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
        { key: "reason", label: "Reason" }
      ],
      rows
    }
  };
}