DO $$ BEGIN
  CREATE TYPE "InAppNotificationType" AS ENUM ('NEWS_CREATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "InAppNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "type" "InAppNotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "link" TEXT,
  "payload" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "InAppNotification"
  ADD CONSTRAINT "InAppNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "InAppNotification"
  ADD CONSTRAINT "InAppNotification_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "InAppNotification_userId_isRead_createdAt_idx"
ON "InAppNotification" ("userId", "isRead", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "InAppNotification_cityId_createdAt_idx"
ON "InAppNotification" ("cityId", "createdAt" DESC);
