ALTER TABLE "BusinessSetting" ADD COLUMN "storeSlug" TEXT;
ALTER TABLE "BusinessSetting" ADD COLUMN "storeDescription" TEXT;
ALTER TABLE "BusinessSetting" ADD COLUMN "storeActive" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "BusinessSetting_storeSlug_key" ON "BusinessSetting"("storeSlug");
ALTER TABLE "Product" ADD COLUMN "showInStore" BOOLEAN NOT NULL DEFAULT true;
