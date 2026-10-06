CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "StockMovement" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "notes" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "Ingredient" ADD COLUMN "supplierId" TEXT;
