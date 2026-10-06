-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sellPrice" REAL NOT NULL,
    "calculatedHpp" REAL NOT NULL DEFAULT 0,
    "calculatedMargin" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSellable" BOOLEAN NOT NULL DEFAULT true,
    "isPurchasable" BOOLEAN NOT NULL DEFAULT false,
    "trackInventory" BOOLEAN NOT NULL DEFAULT false,
    "hasBOM" BOOLEAN NOT NULL DEFAULT false,
    "purchaseCost" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("businessId", "calculatedHpp", "calculatedMargin", "categoryId", "hasBOM", "id", "imageUrl", "isActive", "isPurchasable", "isSellable", "name", "sellPrice", "trackInventory") SELECT "businessId", "calculatedHpp", "calculatedMargin", "categoryId", "hasBOM", "id", "imageUrl", "isActive", "isPurchasable", "isSellable", "name", "sellPrice", "trackInventory" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
