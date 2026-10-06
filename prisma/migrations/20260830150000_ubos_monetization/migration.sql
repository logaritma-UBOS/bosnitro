
CREATE TABLE IF NOT EXISTS "UbosRevenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mayarTrxId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "UbosRevenue_mayarTrxId_key" ON "UbosRevenue"("mayarTrxId");

CREATE TABLE IF NOT EXISTS "UbosFeedContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Logaritma Team',
    "category" TEXT NOT NULL DEFAULT 'TIPS',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
