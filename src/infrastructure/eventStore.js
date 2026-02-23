
// src/core/eventStore.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const eventStore = {

  async getState() {
    const ledgerRows = await prisma.stockLedger.findMany();
    const transportRows = await prisma.stockTransport.findMany();

    // console.log('EVENTSTORE DB:', process.env.DATABASE_URL);

    return {
      ledger: ledgerRows.map(r => ({
        mmaCode: r.mmaCode,
        supplierId: r.supplierId,
        shade: r.shade,
        size: r.size,
        qtyDelta: r.qtyDelta,
        reason: r.reason,
        transportId: r.transportId ?? null,
        ts: Number(r.ts),
        meta: r.meta ? JSON.parse(r.meta) : null
      })),

      transport: transportRows.map(r => ({
        transportId: r.transportId,
        type: r.type,
        fromMmaCode: r.fromMmaCode,
        toMmaCode: r.toMmaCode,
        supplierId: r.supplierId,
        shade: r.shade,
        size: r.size,
        qtyDelta: r.qtyDelta,
        ts: Number(r.ts),
        meta: r.meta ? JSON.parse(r.meta) : null
      }))
    };
  },

  async persist(events) {
    await prisma.$transaction(async (tx) => {

      for (const e of events) {

        if (e.type === 'LEDGER') {

          await tx.stockLedger.create({
            data: {
              mmaCode: e.mmaCode,
              supplierId: e.supplierId,
              shade: e.shade,
              size: e.size,
              qtyDelta: e.qtyDelta,
              reason: e.reason,
              transportId: e.transportId ?? null,
              ts: BigInt(e.ts),
              meta: e.meta ? JSON.stringify(e.meta) : null
            }
          });

        } else {

          await tx.stockTransport.create({
            data: {
              transportId: e.transportId,
              type: e.type,
              fromMmaCode: e.fromMmaCode ?? null,
              toMmaCode: e.toMmaCode ?? null,
              supplierId: e.supplierId ?? null,
              shade: e.shade ?? null,
              size: e.size ?? null,
              qtyDelta: e.qtyDelta,
              ts: BigInt(e.ts),
              meta: e.meta ? JSON.stringify(e.meta) : null
            }
          });

        }

      }

    });
  }

};