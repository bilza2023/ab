/*
  Warnings:

  - You are about to drop the column `linkId` on the `StockLedger` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `StockTransport` table. All the data in the column will be lost.
  - Added the required column `qtyDelta` to the `StockTransport` table without a default value. This is not possible if the table is not empty.
  - Made the column `shade` on table `StockTransport` required. This step will fail if there are existing NULL values in that column.
  - Made the column `size` on table `StockTransport` required. This step will fail if there are existing NULL values in that column.
  - Made the column `supplierId` on table `StockTransport` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mmaCode" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "shade" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "qtyDelta" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "transportId" TEXT,
    "ts" BIGINT NOT NULL,
    "meta" TEXT
);
INSERT INTO "new_StockLedger" ("createdAt", "id", "meta", "mmaCode", "qtyDelta", "reason", "shade", "size", "supplierId", "ts") SELECT "createdAt", "id", "meta", "mmaCode", "qtyDelta", "reason", "shade", "size", "supplierId", "ts" FROM "StockLedger";
DROP TABLE "StockLedger";
ALTER TABLE "new_StockLedger" RENAME TO "StockLedger";
CREATE INDEX "StockLedger_mmaCode_idx" ON "StockLedger"("mmaCode");
CREATE INDEX "StockLedger_supplierId_idx" ON "StockLedger"("supplierId");
CREATE INDEX "StockLedger_mmaCode_supplierId_shade_size_idx" ON "StockLedger"("mmaCode", "supplierId", "shade", "size");
CREATE INDEX "StockLedger_transportId_idx" ON "StockLedger"("transportId");
CREATE TABLE "new_StockTransport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromMmaCode" TEXT,
    "toMmaCode" TEXT,
    "supplierId" INTEGER NOT NULL,
    "shade" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "qtyDelta" REAL NOT NULL,
    "ts" BIGINT NOT NULL,
    "meta" TEXT
);
INSERT INTO "new_StockTransport" ("createdAt", "fromMmaCode", "id", "meta", "shade", "size", "supplierId", "toMmaCode", "transportId", "ts", "type") SELECT "createdAt", "fromMmaCode", "id", "meta", "shade", "size", "supplierId", "toMmaCode", "transportId", "ts", "type" FROM "StockTransport";
DROP TABLE "StockTransport";
ALTER TABLE "new_StockTransport" RENAME TO "StockTransport";
CREATE INDEX "StockTransport_transportId_idx" ON "StockTransport"("transportId");
CREATE INDEX "StockTransport_type_idx" ON "StockTransport"("type");
CREATE INDEX "StockTransport_fromMmaCode_idx" ON "StockTransport"("fromMmaCode");
CREATE INDEX "StockTransport_toMmaCode_idx" ON "StockTransport"("toMmaCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
