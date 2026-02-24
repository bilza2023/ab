// /src/processes/sorting.js

import { prisma, stock } from '../stocks/stockEngine.js';

export default async function sorting({
  supplierId,
  fromMmaCode,
  toMmaCode,
  shade,
  size,
  qty,
  ht = 0,
  wastage = 0,
  meta = null,
} = {}) {

  if (!supplierId) throw new Error('supplierId is required');
  if (!fromMmaCode) throw new Error('fromMmaCode is required');
  if (!toMmaCode) throw new Error('toMmaCode is required');
  if (!shade) throw new Error('shade is required');
  if (!size) throw new Error('size is required');

  const inputQty = Number(qty);
  const lossHt = Number(ht ?? 0);
  const lossWastage = Number(wastage ?? 0);
  const totalLoss = lossHt + lossWastage;

  if (!(inputQty > 0)) {
    throw new Error('qty must be > 0');
  }

  if (totalLoss < 0) {
    throw new Error('ht + wastage cannot be negative');
  }

  if (totalLoss >= inputQty) {
    throw new Error('Invalid transition: total loss cannot be >= qty');
  }

  const netQty = inputQty - totalLoss;

  // 1️⃣ Check availability
  const available = await stock.onHand({
    mmaCode: fromMmaCode,
    supplierId,
    shade,
    size,
  });

  if (Number(available) < inputQty) {
    return {
      status: 'FAILED',
      error: `Insufficient stock: have ${available}, need ${inputQty}`,
    };
  }

  // 2️⃣ Create header FIRST
  const header = await prisma.sorting_tbl.create({
    data: {
      ht: lossHt,
      wastage: lossWastage,
      meta,
    },
  });

  const linkId = String(header.id);

  let withdrew = false;
  let deposited = false;

  try {
    // 3️⃣ Withdraw FULL input qty
    await stock.withdraw({
      fromMmaCode,
      supplierId,
      shade,
      size,
      qty: inputQty,
      processId: linkId,
      reason: 'PROCESS',
      meta: { ...meta, step: 'sorting.withdraw' },
    });

    withdrew = true;

    // 4️⃣ Deposit NET qty
    await stock.deposit({
      toMmaCode,
      supplierId,
      shade,
      size,
      qty: netQty,
      processId: linkId,
      reason: 'PROCESS',
      meta: { ...meta, step: 'sorting.deposit' },
    });

    deposited = true;

    // 5️⃣ Mark committed
    await prisma.sorting_tbl.update({
      where: { id: header.id },
      data: { committedAt: new Date() },
    });

    return { status: 'SUCCESS', id: header.id };

  } catch (err) {

    // 🔁 Rollback logic
    try {
      if (deposited) {
        await stock.withdraw({
          fromMmaCode: toMmaCode,
          supplierId,
          shade,
          size,
          qty: netQty,
          processId: linkId,
          meta: { ...meta, step: 'sorting.rollback.deposit' },
        });
      }

      if (withdrew) {
        await stock.deposit({
          toMmaCode: fromMmaCode,
          supplierId,
          shade,
          size,
          qty: inputQty,
          processId: linkId,
          meta: { ...meta, step: 'sorting.rollback.withdraw' },
        });
      }

    } finally {
      await prisma.sorting_tbl
        .delete({ where: { id: header.id } })
        .catch(() => null);
    }

    return {
      status: 'ROLLED_BACK',
      error: String(err?.message ?? err),
    };
  }
}