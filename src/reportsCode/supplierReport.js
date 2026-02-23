import { eventStore } from '../infrastructure/eventStore.js';

export async function buildSupplierReport() {

  const state = await eventStore.getState();

  const supplierMap = new Map();

  for (const row of state.ledger) {

    // Only count DEPOSIT rows
    if (row.reason !== 'DEPOSIT') continue;
    if (row.qtyDelta <= 0) continue;

    const supplierId = row.supplierId;

    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        supplierId,
        totalDelivered: 0,
        deliveries: []
      });
    }

    const bucket = supplierMap.get(supplierId);

    bucket.totalDelivered += row.qtyDelta;

    bucket.deliveries.push({
      ts: row.ts,
      mmaCode: row.mmaCode,
      shade: row.shade,
      size: row.size,
      qty: row.qtyDelta
    });
  }

  const sections = [];

  for (const supplier of supplierMap.values()) {

    supplier.deliveries.sort((a, b) => b.ts - a.ts);

    sections.push({
      supplierId: supplier.supplierId,
      totalDelivered: supplier.totalDelivered,
      totalDeliveries: supplier.deliveries.length,
      deliveries: supplier.deliveries
    });
  }

  sections.sort((a, b) => b.totalDelivered - a.totalDelivered);

  return {
    meta: {
      title: "Supplier Delivery Report",
      generatedAt: new Date().toISOString()
    },

    kpis: {
      totalSuppliers: sections.length
    },

    sections
  };
}