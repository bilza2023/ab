
// receive.js
// Single-file receive logic (no MMA, no StockEngine, no company)

import { eventStore } from '../infrastructure/eventStore.js';

export async function receive({ transportId, qty }) {
  if (!transportId) throw new Error('transportId is required');
  if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
    throw new Error('qty must be > 0');
  }

  qty = Number(qty);
  const ts = Date.now();

  // 1️⃣ Load current state
  const state = await eventStore.getState();
  const { transport } = state;
  // console.log(state);
  // 2️⃣ Find DISPATCH event
  const dispatch = transport.find(
    t => t.transportId === transportId && t.type === 'DISPATCH'
  );

  if (!dispatch) {
    throw new Error('DISPATCH not found');
  }

  // 3️⃣ Prevent double receive
  const already = transport.find(
    t => t.transportId === transportId && t.type === 'RECEIVE'
  );

  if (already) {
    throw new Error('Transport already received');
  }

  // 4️⃣ Prevent receive if canceled
  const canceled = transport.find(
    t => t.transportId === transportId && t.type === 'CANCEL'
  );

  if (canceled) {
    throw new Error('Transport canceled');
  }

  // 5️⃣ Create RECEIVE transport event
  const receiveEvent = {
    type: 'RECEIVE',
    transportId,
    fromMmaCode: dispatch.fromMmaCode,
    toMmaCode: dispatch.toMmaCode,
    supplierId: dispatch.supplierId,
    shade: dispatch.shade,
    size: dispatch.size,
    qty,
    ts
  };

  // 6️⃣ Create LEDGER event (actual received qty)
  const ledgerEvent = {
    type: 'LEDGER',
    mmaCode: dispatch.toMmaCode,
    supplierId: dispatch.supplierId,
    shade: dispatch.shade,
    size: dispatch.size,
    qtyDelta: qty,
    reason: 'TRANSPORT',
    linkId: transportId,
    ts
  };

  // 7️⃣ Persist events
  await eventStore.persist([receiveEvent, ledgerEvent]);

  return [receiveEvent, ledgerEvent];
}