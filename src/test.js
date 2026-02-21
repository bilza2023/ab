import { ABS_RAW, PSS_SCREENED } from './mmas/index.js';

// Deposit
ABS_RAW.deposit({
  supplierId: 1,
  shade: 'WHITE',
  size: 'mixed',
  qty: 100
});

// Dispatch
ABS_RAW.dispatch({
  toMmaCode: 'PSS_SCREENED',
  transportId: 'T1',
  supplierId: 1,
  shade: 'WHITE',
  size: 'mixed',
  qty: 40
});

// Receive
PSS_SCREENED.receive({
  transportId: 'T1'
});

console.log('ABS balance:',
  ABS_RAW.onHand({ supplierId: 1, shade: 'WHITE', size: 'mixed' })
);

console.log('PSS balance:',
  PSS_SCREENED.onHand({ supplierId: 1, shade: 'WHITE', size: 'mixed' })
);