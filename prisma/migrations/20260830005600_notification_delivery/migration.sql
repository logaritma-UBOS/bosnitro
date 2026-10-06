-- AlterTable OwnerCampaign
ALTER TABLE "OwnerCampaign" ADD COLUMN "title" TEXT;
ALTER TABLE "OwnerCampaign" ADD COLUMN "cta" TEXT;
ALTER TABLE "OwnerCampaign" ADD COLUMN "ctaUrl" TEXT;
ALTER TABLE "OwnerCampaign" ADD COLUMN "delivered" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OwnerCampaign" ADD COLUMN "opened" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OwnerCampaign" ADD COLUMN "clicked" INTEGER NOT NULL DEFAULT 0;

-- AlterTable OwnerNotification
ALTER TABLE "OwnerNotification" ADD COLUMN "title" TEXT;
ALTER TABLE "OwnerNotification" ADD COLUMN "cta" TEXT;
ALTER TABLE "OwnerNotification" ADD COLUMN "ctaUrl" TEXT;
ALTER TABLE "OwnerNotification" ADD COLUMN "readAt" DATETIME;
ALTER TABLE "OwnerNotification" ADD COLUMN "clickedAt" DATETIME;
ALTER TABLE "OwnerNotification" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "OwnerNotification" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OwnerNotification" ADD COLUMN "lastAttemptAt" DATETIME;
ALTER TABLE "OwnerNotification" ADD COLUMN "errorMessage" TEXT;

CREATE UNIQUE INDEX "OwnerNotification_idempotencyKey_key" ON "OwnerNotification"("idempotencyKey");
