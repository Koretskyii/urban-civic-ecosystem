ALTER TABLE "GeneralNews"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "GeneralNews_cityId_deletedAt_createdAt_idx"
ON "GeneralNews" ("cityId", "deletedAt", "createdAt" DESC);
