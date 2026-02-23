
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const appData = {

  async suppliersList() {
    return prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  },

  sizesList() {
    return ['Fine', 'Medium', 'Lumps'];
  },

  shadesList() {
    return ['White', 'Grey', 'Black', 'Mixed'];
  },

  mmaList() {
    return ['ABS_RAW', 'PSS_RAW', 'KEF'];
  }

};