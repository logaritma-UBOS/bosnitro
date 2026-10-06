CREATE TABLE "SystemSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updatedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

CREATE TABLE "OwnerAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actionType" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "goal" TEXT,
  "target" REAL,
  "actualBefore" REAL,
  "actualAfter" REAL,
  "gap" REAL,
  "recommendation" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECOMMENDED',
  "expectedResult" TEXT,
  "actualResult" TEXT,
  "evaluation" TEXT,
  "ownerNote" TEXT,
  "acceptedAt" DATETIME,
  "executedAt" DATETIME,
  "evaluatedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
