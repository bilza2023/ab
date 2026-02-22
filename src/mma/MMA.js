// src/core/MMA.js

import { StockEngine } from './StockEngine.js';

export class MMA {
  constructor({ code, stationCode, getState, persistEvents }) {
    if (!code) throw new Error('MMA code is required');
    if (!stationCode) throw new Error('stationCode is required');
    if (!getState) throw new Error('getState(state) provider is required');
    if (!persistEvents) throw new Error('persistEvents(events) is required');

    this.code = code;
    this.stationCode = stationCode;
  
    // Infrastructure injected (not DB directly)
    this._getState = getState;          // () => { ledger, transport }
    this._persist = persistEvents;      // (events[]) => void
  }

  // ---------------------------
  // Internal Helpers
  // ---------------------------

  _now() {
    return Date.now();
  }

  _require(val, name) {
    if (val == null || val === '') {
      throw new Error(`${name} is required`);
    }
  }

  _requireQty(qty) {
    if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
      throw new Error('qty must be > 0');
    }
  }

  // ---------------------------
  // Core Operations
  // ---------------------------

async  deposit({ supplierId, shade, size, qty, reason = 'DEPOSIT', meta }) {
    this._require(supplierId, 'supplierId');
    this._require(shade, 'shade');
    this._requireQty(qty);

    const state = await this._getState();

    const events = StockEngine.deposit(state, {
      toMmaCode: this.code,
      supplierId,
      shade,
      size,
      qty,
      reason,
      meta,
      ts: this._now()
    });

    await this._persist(events);
    return events;
  }

async  withdraw({ supplierId, shade, size, qty, reason = 'WITHDRAW', meta }) {
    this._require(supplierId, 'supplierId');
    this._require(shade, 'shade');
    this._requireQty(qty);

    const state = await this._getState();

    const events = StockEngine.withdraw(state, {
      fromMmaCode: this.code,
      supplierId,
      shade,
      size,
      qty,
      reason,
      meta,
      ts: this._now()
    });

    await this._persist(events);
    return events;
  }

async  dispatch({ toMmaCode, transportId, supplierId, shade, size, qty, meta }) {
    this._require(toMmaCode, 'toMmaCode');
    this._require(transportId, 'transportId');
    this._require(supplierId, 'supplierId');
    this._require(shade, 'shade');
    this._requireQty(qty);

    const state = await this._getState();

    const events = StockEngine.dispatch(state, {
      transportId,
      fromMmaCode: this.code,
      toMmaCode,
      supplierId,
      shade,
      size,
      qty,
      meta,
      ts: this._now()
    });

    await this._persist(events);
    return events;
  }

async  receive({ transportId }) {
    this._require(transportId, 'transportId');

    const state = await this._getState();

    const events = StockEngine.receive(state, {
      transportId,
      ts: this._now()
    });

    if (events.length > 0) {
      await this._persist(events);
    }

    return events;
  }

async  cancel({ transportId }) {
    this._require(transportId, 'transportId');

    const state = await this._getState();

    const events = StockEngine.cancel(state, {
      transportId,
      ts: this._now()
    });

    if (events.length > 0) {
      await this._persist(events);
    }

    return events;
  }

  // ---------------------------
  // Read
  // ---------------------------

}