import { MMA } from '../mma/MMA.js';
import { eventStore } from '../infrastructure/eventStore.js';

// -----------------------------
// Config: All MMA Codes
// -----------------------------

const MMA_CODES = [
  'ABS_RAW',
  'PSS_SCREENED',
  'KEF_FINAL'
];

// -----------------------------
// Factory
// -----------------------------

function createMma(code) {
  return new MMA({
    code,
    stationCode: code.split('_')[0],
    getState: () => eventStore.getState(),
    persistEvents: (events) => eventStore.persist(events)
  });
}

// -----------------------------
// Public API
// -----------------------------

export const company = {

  getAllMmaCodes() {
    return MMA_CODES;
  },

  async deposit(mmaCode, data) {
    const mma = createMma(mmaCode);

    await mma.deposit({
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty)
    });
  },

  async dispatch(mmaCode, data) {
    const mma = createMma(mmaCode);

    await mma.dispatch({
      toMmaCode: data.toMmaCode,
      transportId: data.transportId,
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty)
    });
  },

  async getStationReport(mmaCode) {
    const mma = createMma(mmaCode);

    const state = await eventStore.getState();

    const rows = state.ledger.filter(l => l.mmaCode === mmaCode);

    // Aggregate balances
    const map = {};

    for (const row of rows) {
      const key = `${row.supplierId}|${row.shade}|${row.size}`;

      if (!map[key]) {
        map[key] = {
          supplierId: row.supplierId,
          shade: row.shade,
          size: row.size,
          qty: 0
        };
      }

      map[key].qty += row.qtyDelta;
    }

    return Object.values(map).filter(r => r.qty !== 0);
  },

  async getGlobalReport() {
    const stations = [];

    for (const code of MMA_CODES) {
      const balances = await this.getStationReport(code);
      stations.push({ code, balances });
    }

    return stations;
  }

};