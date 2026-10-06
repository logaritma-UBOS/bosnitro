-- AlterTable
ALTER TABLE "BusinessSetting" ADD COLUMN "receiptFooter" TEXT;
ALTER TABLE "BusinessSetting" ADD COLUMN "storeAddress" TEXT;
ALTER TABLE "BusinessSetting" ADD COLUMN "storePhone" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "cashReceived" REAL;
ALTER TABLE "Sale" ADD COLUMN "changeAmount" REAL;
