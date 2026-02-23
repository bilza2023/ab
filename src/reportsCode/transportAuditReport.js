import { eventStore } from '../infrastructure/eventStore.js';

export async function buildTransportAuditReport() {

  const state = await eventStore.getState();

  const map = new Map();

  for (const t of state.transport) {

    if (!map.has(t.transportId)) {
      map.set(t.transportId, {
        transportId: t.transportId,
        dispatchQty: 0,
        receiveQty: 0,
        cancelQty: 0,
        hasReceive: false,
        hasCancel: false
      });
    }

    const bucket = map.get(t.transportId);

    if (t.type === 'DISPATCH') {
      bucket.dispatchQty += Math.abs(t.qtyDelta);
    }

    if (t.type === 'RECEIVE') {
      bucket.receiveQty += Math.abs(t.qtyDelta);
      bucket.hasReceive = true;
    }

    if (t.type === 'CANCEL') {
      bucket.cancelQty += Math.abs(t.qtyDelta);
      bucket.hasCancel = true;
    }
  }

  const rows = [];

  for (const bucket of map.values()) {

    // 🔥 Only audit completed transports
    const isCompleted = bucket.hasReceive || bucket.hasCancel;
    if (!isCompleted) continue;

    let status = 'OK';

    if (bucket.hasCancel) {
      status = 'CANCELLED';
    } 
    else if (bucket.receiveQty !== bucket.dispatchQty) {
      status = 'MISMATCH';
    }

    rows.push({
      transportId: bucket.transportId,
      dispatchQty: bucket.dispatchQty,
      receiveQty: bucket.receiveQty,
      cancelQty: bucket.cancelQty,
      difference: bucket.dispatchQty - bucket.receiveQty,
      status
    });
  }

  rows.sort((a, b) => b.dispatchQty - a.dispatchQty);

  const totalTransports = rows.length;
  const mismatches = rows.filter(r => r.status === 'MISMATCH').length;

  return {
    meta: {
      title: "Transport Audit Report",
      generatedAt: new Date().toISOString()
    },

    kpis: {
      totalTransports,
      mismatches
    },

    table: {
      columns: [
        { key: 'transportId', label: 'Transport ID' },
        { key: 'dispatchQty', label: 'Dispatch Qty' },
        { key: 'receiveQty', label: 'Received Qty' },
        { key: 'cancelQty', label: 'Cancelled Qty' },
        { key: 'difference', label: 'Difference' },
        { key: 'status', label: 'Status' }
      ],
      rows
    }
  };
}