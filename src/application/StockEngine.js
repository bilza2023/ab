
// src/StockEngine.js

export const StockEngine = (() => {

  const sizeDefault = 'ANY';

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

  // --------------------------------
  // READ
  // --------------------------------

  const onHand = (ledger, { mmaCode, supplierId, shade, size }) => {
    const key = bucketKey({ mmaCode, supplierId, shade, size });

    return ledger
      .filter(e => bucketKey(e) === key)
      .reduce((sum, e) => sum + e.qtyDelta, 0);
  };

  const transportBalance = (transportEvents, transportId) => {
    return transportEvents
      .filter(t => t.transportId === transportId)
      .reduce((sum, t) => sum + t.qtyDelta, 0);
  };

  // --------------------------------
  // DEPOSIT
  // --------------------------------

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
      transportId: null,
      meta,
      ts
    }];
  };

  // --------------------------------
  // WITHDRAW
  // --------------------------------

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
      throw new Error(`Insufficient stock`);
    }

    return [{
      type: 'LEDGER',
      mmaCode: fromMmaCode,
      supplierId,
      shade,
      size: normSize(size),
      qtyDelta: -Number(qty),
      reason,
      transportId: null,
      meta,
      ts
    }];
  };

  // --------------------------------
  // DISPATCH
  // --------------------------------

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
    needPos(qty);
    need(ts, 'ts');

    const existing = state.transport.find(
      t => t.transportId === transportId
    );
    if (existing) throw new Error('Duplicate transportId');

    const available = onHand(state.ledger, {
      mmaCode: fromMmaCode,
      supplierId,
      shade,
      size
    });

    if (available < qty) {
      throw new Error('Insufficient stock');
    }

    return [

      // Transport event (+)
      {
        type: 'DISPATCH',
        transportId,
        fromMmaCode,
        toMmaCode,
        supplierId,
        shade,
        size: normSize(size),
        qtyDelta: Number(qty),
        meta,
        ts
      },

      // Ledger event (-)
      {
        type: 'LEDGER',
        mmaCode: fromMmaCode,
        supplierId,
        shade,
        size: normSize(size),
        qtyDelta: -Number(qty),
        reason: 'TRANSPORT',
        transportId,
        meta,
        ts
      }
    ];
  };

  // --------------------------------
  // RECEIVE (partial supported)
  // --------------------------------

  const receive = (state, { transportId, qty, ts }) => {

    need(transportId, 'transportId');
    needPos(qty);
    need(ts, 'ts');

    const dispatchEvent = state.transport.find(
      t => t.transportId === transportId && t.type === 'DISPATCH'
    );

    if (!dispatchEvent) throw new Error('DISPATCH not found');

    const balance = transportBalance(state.transport, transportId);

    if (qty > balance) {
      throw new Error('Receive exceeds pending qty');
    }

    return [

      // Transport event (-)
      {
        type: 'RECEIVE',
        transportId,
        fromMmaCode: dispatchEvent.fromMmaCode,
        toMmaCode: dispatchEvent.toMmaCode,
        supplierId: dispatchEvent.supplierId,
        shade: dispatchEvent.shade,
        size: dispatchEvent.size,
        qtyDelta: -Number(qty),
        ts
      },

      // Ledger event (+)
      {
        type: 'LEDGER',
        mmaCode: dispatchEvent.toMmaCode,
        supplierId: dispatchEvent.supplierId,
        shade: dispatchEvent.shade,
        size: dispatchEvent.size,
        qtyDelta: Number(qty),
        reason: 'TRANSPORT',
        transportId,
        ts
      }
    ];
  };

  // --------------------------------
  // CANCEL (reverses remaining)
  // --------------------------------

  const cancel = (state, { transportId, ts }) => {

    need(transportId, 'transportId');
    need(ts, 'ts');

    const balance = transportBalance(state.transport, transportId);
    if (balance <= 0) return [];

    const dispatchEvent = state.transport.find(
      t => t.transportId === transportId && t.type === 'DISPATCH'
    );

    return [

      {
        type: 'CANCEL',
        transportId,
        fromMmaCode: dispatchEvent.fromMmaCode,
        toMmaCode: dispatchEvent.toMmaCode,
        supplierId: dispatchEvent.supplierId,
        shade: dispatchEvent.shade,
        size: dispatchEvent.size,
        qtyDelta: -balance,
        ts
      },

      {
        type: 'LEDGER',
        mmaCode: dispatchEvent.fromMmaCode,
        supplierId: dispatchEvent.supplierId,
        shade: dispatchEvent.shade,
        size: dispatchEvent.size,
        qtyDelta: balance,
        reason: 'CANCEL',
        transportId,
        ts
      }
    ];
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