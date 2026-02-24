-- CreateTable
CREATE TABLE "sorting_tbl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" DATETIME,
    "ht" DECIMAL,
    "wastage" DECIMAL,
    "meta" TEXT
);

-- CreateTable
CREATE TABLE "screening_tbl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qtyT" DECIMAL NOT NULL,
    "committedAt" DATETIME,
    "meta" TEXT
);

-- CreateIndex
CREATE INDEX "sorting_tbl_createdAt_idx" ON "sorting_tbl"("createdAt");

-- CreateIndex
CREATE INDEX "screening_tbl_createdAt_idx" ON "screening_tbl"("createdAt");
