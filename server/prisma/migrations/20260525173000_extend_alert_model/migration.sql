-- AlterTable
ALTER TABLE "Alert"
ADD COLUMN IF NOT EXISTS "publisherId" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Alert_cityId_deletedAt_createdAt_idx"
ON "Alert"("cityId", "deletedAt", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Alert_cityId_alertTypeId_createdAt_idx"
ON "Alert"("cityId", "alertTypeId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Alert"
ADD CONSTRAINT "Alert_publisherId_fkey"
FOREIGN KEY ("publisherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
