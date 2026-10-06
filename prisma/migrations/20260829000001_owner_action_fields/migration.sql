ALTER TABLE "OwnerAction" ADD COLUMN "gapBefore" REAL;
ALTER TABLE "OwnerAction" ADD COLUMN "gapAfter" REAL;
ALTER TABLE "OwnerAction" ADD COLUMN "severity" TEXT;
ALTER TABLE "OwnerAction" ADD COLUMN "confidence" TEXT;
ALTER TABLE "OwnerAction" ADD COLUMN "direction" TEXT DEFAULT 'HIGHER_IS_BETTER';
ALTER TABLE "OwnerAction" ADD COLUMN "nextAction" TEXT;
