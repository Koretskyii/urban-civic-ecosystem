-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "Alert"
ADD COLUMN "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Backfill existing rows explicitly
UPDATE "Alert"
SET "severity" = 'MEDIUM'
WHERE "severity" IS NULL;

UPDATE "Alert"
SET "expiresAt" = NULL
WHERE "expiresAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Alert_cityId_deletedAt_severity_createdAt_idx"
ON "Alert"("cityId", "deletedAt", "severity", "createdAt" DESC);

CREATE INDEX "Alert_expiresAt_idx"
ON "Alert"("expiresAt");
