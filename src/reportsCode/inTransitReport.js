
import { eventStore } from '../infrastructure/eventStore.js';

export async function buildInTransitReport() {

  const state = await eventStore.getState();

  const map = new Map();

  for (const t of state.transport) {

    if (!map.has(t.transportId)) {
      map.set(t.transportId, {
        transportId: t.transportId,
        fromMmaCode: t.fromMmaCode,
        toMmaCode: t.toMmaCode,
        supplierId: t.supplierId,
        shade: t.shade,
        size: t.size,
        hasDispatch: false,
        hasReceive: false,
        hasCancel: false,
        dispatchQty: 0
      });
    }

    const bucket = map.get(t.transportId);

    if (t.type === 'DISPATCH') {
      bucket.hasDispatch = true;
      bucket.dispatchQty += Math.abs(t.qtyDelta);
    }

    if (t.type === 'RECEIVE') {
      bucket.hasReceive = true;
    }

    if (t.type === 'CANCEL') {
      bucket.hasCancel = true;
    }
  }

  const rows = [];

  for (const bucket of map.values()) {

    const isPending =
      bucket.hasDispatch &&
      !bucket.hasReceive &&
      !bucket.hasCancel;

    if (isPending) {
      rows.push({
        transportId: bucket.transportId,
        fromMmaCode: bucket.fromMmaCode,
        toMmaCode: bucket.toMmaCode,
        supplierId: bucket.supplierId,
        shade: bucket.shade,
        size: bucket.size,
        qty: bucket.dispatchQty
      });
    }
  }

  rows.sort((a, b) => b.qty - a.qty);

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