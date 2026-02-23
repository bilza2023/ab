import { eventStore } from '../infrastructure/eventStore.js';

export async function buildTransportAuditReport({ transportId }) {

  if (!transportId) {
    throw new Error('transportId is required');
  }

  const state = await eventStore.getState();

  const rows = state.transport
    .filter(t => t.transportId === transportId)
    .map(t => ({
      ts: t.ts,
      type: t.type,
      fromMmaCode: t.fromMmaCode,
      toMmaCode: t.toMmaCode,
      supplierId: t.supplierId,
      shade: t.shade,
      size: t.size,
      qtyDelta: t.qtyDelta
    }))
    .sort((a, b) => a.ts - b.ts);

  if (rows.length === 0) {
    throw new Error(`No transport found for ${transportId}`);
  }

  const netBalance = rows.reduce((sum, r) => sum + r.qtyDelta, 0);

  let status = 'IN_TRANSIT';
  if (netBalance === 0) {
    const hasCancel = rows.some(r => r.type === 'CANCEL');
    status = hasCancel ? 'CANCELLED' : 'RECEIVED';
  }

  return {
    meta: {
      title: `Transport Audit: ${transportId}`,
      generatedAt: new Date().toISOString(),
      transportId,
      status
    },

    kpis: {
      totalEvents: rows.length,
      netBalance
    },

    table: {
      columns: [
        { key: 'ts', label: 'Timestamp' },
        { key: 'type', label: 'Type' },
        { key: 'fromMmaCode', label: 'From' },
        { key: 'toMmaCode', label: 'To' },
        { key: 'supplierId', label: 'Supplier' },
        { key: 'shade', label: 'Shade' },
        { key: 'size', label: 'Size' },
        { key: 'qtyDelta', label: 'Qty Δ' }
      ],
      rows
    }
  };
}