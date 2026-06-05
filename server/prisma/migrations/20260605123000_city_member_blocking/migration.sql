ALTER TABLE "UserCity"
  ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "blockedAt" TIMESTAMP(3),
  ADD COLUMN "blockedById" TEXT;

CREATE INDEX "UserCity_cityId_isBlocked_idx" ON "UserCity"("cityId", "isBlocked");
