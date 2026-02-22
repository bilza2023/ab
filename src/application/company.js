import { MMA } from '../mma/MMA.js';
import { eventStore } from '../infrastructure/eventStore.js';

// ----------------------------------
// Config
// ----------------------------------

const MMA_CODES = [
  'ABS_RAW',
  'PSS_SCREENED',
  'KEF_FINAL'
];

// ----------------------------------
// Factory
// ----------------------------------

function createMma(code) {
  if (!MMA_CODES.includes(code)) {
    throw new Error(`Invalid MMA code: ${code}`);
  }

  return new MMA({
    code,
    stationCode: code.split('_')[0],
    getState: () => eventStore.getState(),
    persistEvents: (events) => eventStore.persist(events)
  });
}

// ----------------------------------
// Application Facade (Verbs Only)
// ----------------------------------

export const company = {

  // ----- Meta -----

  getAllMmaCodes() {
    return MMA_CODES;
  },

  // ----- Verbs -----

  async deposit(mmaCode, data) {
    const mma = createMma(mmaCode);

    return mma.deposit({
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty)
    });
  },

  async withdraw(mmaCode, data) {
    const mma = createMma(mmaCode);

    return mma.withdraw({
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty),
      reason: 'WITHDRAW'
    });
  },

  async dispatch(mmaCode, data) {
    const mma = createMma(mmaCode);

    return mma.dispatch({
      toMmaCode: data.toMmaCode,
      transportId: data.transportId,
      supplierId: Number(data.supplierId),
      shade: data.shade,
      size: data.size,
      qty: Number(data.qty)
    });
  },

  async receive(mmaCode, data) {
    const mma = createMma(mmaCode);

 console.log(data);
    return mma.receive({
      transportId: data.transportId,
      supplierId:data.supplierId, 
      qty:data.qty,
      toMmaCode:data.toMmaCode
    });
  },

  async cancel(mmaCode, data) {
    const mma = createMma(mmaCode);

    return mma.cancel({
      transportId: data.transportId
    });
  }

};