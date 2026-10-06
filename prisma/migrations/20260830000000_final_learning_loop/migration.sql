-- AlterTable OwnerCampaign
ALTER TABLE "OwnerCampaign" ADD COLUMN "actionId" TEXT;

-- AlterTable OwnerNotification
ALTER TABLE "OwnerNotification" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "OwnerNotification" ADD COLUMN "actionId" TEXT;
ALTER TABLE "OwnerNotification" ADD COLUMN "scheduledAt" DATETIME;
ALTER TABLE "OwnerNotification" ADD COLUMN "sentAt" DATETIME;
ALTER TABLE "OwnerNotification" ADD COLUMN "failedAt" DATETIME;

-- AlterTable OwnerAction
ALTER TABLE "OwnerAction" ADD COLUMN "learningResult" TEXT;
