-- CreateTable
CREATE TABLE "StockLedger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mmaCode" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "shade" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "qtyDelta" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "linkId" TEXT,
    "ts" BIGINT NOT NULL,
    "meta" TEXT
);

-- CreateTable
CREATE TABLE "StockTransport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromMmaCode" TEXT,
    "toMmaCode" TEXT,
    "supplierId" INTEGER,
    "shade" TEXT,
    "size" TEXT,
    "qty" REAL,
    "ts" BIGINT NOT NULL,
    "meta" TEXT
);

-- CreateIndex
CREATE INDEX "StockLedger_mmaCode_idx" ON "StockLedger"("mmaCode");

-- CreateIndex
CREATE INDEX "StockLedger_supplierId_idx" ON "StockLedger"("supplierId");

-- CreateIndex
CREATE INDEX "StockLedger_mmaCode_supplierId_shade_size_idx" ON "StockLedger"("mmaCode", "supplierId", "shade", "size");

-- CreateIndex
CREATE INDEX "StockTransport_transportId_idx" ON "StockTransport"("transportId");

-- CreateIndex
CREATE INDEX "StockTransport_fromMmaCode_idx" ON "StockTransport"("fromMmaCode");

-- CreateIndex
CREATE INDEX "StockTransport_toMmaCode_idx" ON "StockTransport"("toMmaCode");
