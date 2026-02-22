// ab-engine/src/StockEngine.js

export const StockEngine = (() => {

  const sizeDefault = 'ANY';

  // ---------------------------
  // Helpers
  // ---------------------------

  const need = (val, name) => {
    if (val == null || val === '') {
      throw new Error(`${name} is required`);
    }
  };

  const needPos = (qty) => {
    if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
      throw new Error('qty must be > 0');
    }
  };

  const normSize = (size) => size ?? sizeDefault;

  const bucketKey = ({ mmaCode, supplierId, shade, size }) =>
    `${mmaCode}|${supplierId}|${shade}|${normSize(size)}`;

  // ---------------------------
  // READS (pure)
  // ---------------------------

  const onHand = (ledger, { mmaCode, supplierId, shade, size }) => {
    const key = bucketKey({ mmaCode, supplierId, shade, size });
    // console.log("ledger" ,ledger);
    return ledger
      .filter(e => bucketKey(e) === key)
      .reduce((sum, e) => sum + e.qtyDelta, 0);
  };

  // ---------------------------
  // COMMANDS (pure)
  // ---------------------------

  const deposit = (state, {
    toMmaCode,
    supplierId,
    shade,
    size,
    qty,
    reason = 'DEPOSIT',
    meta = null,
    ts
  }) => {

    need(toMmaCode, 'toMmaCode');
    need(supplierId, 'supplierId');
    need(shade, 'shade');
    needPos(qty);
    need(ts, 'ts');

    return [{
      type: 'LEDGER',
      mmaCode: toMmaCode,
      supplierId,
      shade,
      size: normSize(size),
      qtyDelta: Number(qty),
      reason,
      meta,
      ts
    }];
  };

  const withdraw = (state, {
    fromMmaCode,
    supplierId,
    shade,
    size,
    qty,
    reason = 'WITHDRAW',
    meta = null,
    ts
  }) => {

    need(fromMmaCode, 'fromMmaCode');
    need(supplierId, 'supplierId');
    need(shade, 'shade');
    needPos(qty);
    need(ts, 'ts');

    const available = onHand(state.ledger, {
      mmaCode: fromMmaCode,
      supplierId,
      shade,
      size
    });

    if (available < qty) {
      throw new Error(`Insufficient stock (available=${available}, requested=${qty})`);
    }

    return [{
      type: 'LEDGER',
      mmaCode: fromMmaCode,
      supplierId,
      shade,
      size: normSize(size),
      qtyDelta: -Number(qty),
      reason,
      meta,
      ts
    }];
  };

  const dispatch = (state, {
    transportId,
    fromMmaCode,
    toMmaCode,
    supplierId,
    shade,
    size,
    qty,
    meta = null,
    ts
  }) => {

    need(transportId, 'transportId');
    need(fromMmaCode, 'fromMmaCode');
    need(toMmaCode, 'toMmaCode');
    need(supplierId, 'supplierId');
    need(shade, 'shade');
    needPos(qty);
    need(ts, 'ts');

    const available = onHand(state.ledger, {
      mmaCode: fromMmaCode,
      supplierId,
      shade,
      size
    });

    if (available < qty) {
      throw new Error(`Insufficient stock (available=${available}, requested=${qty})`);
    }

    const transportEvent = {
      type: 'DISPATCH',
      transportId,
      fromMmaCode,
      toMmaCode,
      supplierId,
      shade,
      size: normSize(size),
      qty: Number(qty),
      meta,
      ts
    };

    const ledgerEvent = {
      type: 'LEDGER',
      mmaCode: fromMmaCode,
      supplierId,
      shade,
      size: normSize(size),
      qtyDelta: -Number(qty),
      reason: 'TRANSPORT',
      linkId: transportId,
      meta,
      ts
    };

    return [transportEvent, ledgerEvent];
  };

  const receive = (state, { transportId, qty, ts }) => {
   console.log("qty",qty);
    need(transportId, 'transportId');
    need(qty, 'qty');
    need(ts, 'ts');
  
    qty = Number(qty);
    if (qty <= 0) throw new Error('Invalid receive qty');
  
    // 1️⃣ Find DISPATCH
    const dispatch = state.transport.find(
      t => t.transportId === transportId && t.type === 'DISPATCH'
    );
  
    if (!dispatch) throw new Error('DISPATCH not found');
  
    // 2️⃣ Prevent double receive
    const already = state.transport.find(
      t => t.transportId === transportId && t.type === 'RECEIVE'
    );
  
    if (already) throw new Error('Transport already received');
  
    // 3️⃣ Prevent receive if canceled
    const canceled = state.transport.find(
      t => t.transportId === transportId && t.type === 'CANCEL'
    );
  
    if (canceled) throw new Error('Transport canceled');
  
    // 4️⃣ Create RECEIVE event using incoming qty (NOT dispatch.qty)
    const transportEvent = {
      type: 'RECEIVE',
      transportId,
      fromMmaCode: dispatch.fromMmaCode,
      toMmaCode: dispatch.toMmaCode,
      supplierId: dispatch.supplierId,
      shade: dispatch.shade,
      size: dispatch.size,
      qty,            // 🔥 actual weighed qty
      ts
    };
  
    // 5️⃣ Ledger reflects actual received weight
    const ledgerEvent = {
      type: 'LEDGER',
      mmaCode: dispatch.toMmaCode,
      supplierId: dispatch.supplierId,
      shade: dispatch.shade,
      size: dispatch.size,
      qtyDelta: qty,  // 🔥 actual incoming weight
      reason: 'TRANSPORT',
      linkId: transportId,
      ts
    };
  
    return [transportEvent, ledgerEvent];
  };
  const cancel = (state, { transportId, ts }) => {

    need(transportId, 'transportId');
    need(ts, 'ts');

    const dispatch = state.transport.find(
      t => t.transportId === transportId && t.type === 'DISPATCH'
    );
    if (!dispatch) throw new Error('DISPATCH not found');

    const received = state.transport.find(
      t => t.transportId === transportId && t.type === 'RECEIVE'
    );
    if (received) throw new Error('Already received');

    const already = state.transport.find(
      t => t.transportId === transportId && t.type === 'CANCEL'
    );
    if (already) return [];

    const cancelEvent = {
      type: 'CANCEL',
      transportId,
      fromMmaCode: dispatch.fromMmaCode,
      toMmaCode: dispatch.toMmaCode,
      supplierId: dispatch.supplierId,
      shade: dispatch.shade,
      size: dispatch.size,
      qty: dispatch.qty,
      ts
    };

    const ledgerEvent = {
      type: 'LEDGER',
      mmaCode: dispatch.fromMmaCode,
      supplierId: dispatch.supplierId,
      shade: dispatch.shade,
      size: dispatch.size,
      qtyDelta: dispatch.qty,
      reason: 'REVERSAL',
      linkId: transportId,
      ts
    };

    return [cancelEvent, ledgerEvent];
  };

  return {
    onHand,
    deposit,
    withdraw,
    dispatch,
    receive,
    cancel
  };

})();
