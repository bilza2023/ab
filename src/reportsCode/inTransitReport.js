
import { eventStore } from '../infrastructure/eventStore.js';

export async function buildInTransitReport() {

  const state = await eventStore.getState();

  const transportMap = new Map();

  // Group transport events by transportId
  for (const t of state.transport) {

    if (!transportMap.has(t.transportId)) {
      transportMap.set(t.transportId, {
        transportId: t.transportId,
        fromMmaCode: t.fromMmaCode,
        toMmaCode: t.toMmaCode,
        supplierId: t.supplierId,
        shade: t.shade,
        size: t.size,
        qty: 0
      });
    }

    transportMap.get(t.transportId).qty += t.qtyDelta;
  }

  // Keep only pending (> 0)
  const rows = Array.from(transportMap.values())
    .filter(r => r.qty > 0)
    .sort((a, b) => b.qty - a.qty);

  const totalPendingQty = rows.reduce((sum, r) => sum + r.qty, 0);

  return {
    meta: {
      title: "In-Transit Report",
      generatedAt: new Date().toISOString()
    },

    kpis: {
      totalPendingQty,
      totalTransports: rows.length
    },

    table: {
      columns: [
        { key: "transportId", label: "Transport ID" },
        { key: "fromMmaCode", label: "From" },
        { key: "toMmaCode", label: "To" },
        { key: "supplierId", label: "Supplier" },
        { key: "shade", label: "Shade" },
        { key: "size", label: "Size" },
        { key: "qty", label: "Pending Qty" }
      ],
      rows
    }
  };
}