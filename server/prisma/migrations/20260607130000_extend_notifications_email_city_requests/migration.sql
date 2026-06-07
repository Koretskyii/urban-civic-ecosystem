ALTER TYPE "InAppNotificationType" ADD VALUE IF NOT EXISTS 'CITY_REQUEST_CREATED';
ALTER TYPE "InAppNotificationType" ADD VALUE IF NOT EXISTS 'CITY_REQUEST_ASSIGNED';
ALTER TYPE "InAppNotificationType" ADD VALUE IF NOT EXISTS 'CITY_REQUEST_STATUS_UPDATED';
ALTER TYPE "InAppNotificationType" ADD VALUE IF NOT EXISTS 'CITY_REQUEST_REPORT_CREATED';
ALTER TYPE "InAppNotificationType" ADD VALUE IF NOT EXISTS 'CITY_REQUEST_MESSAGE_CREATED';

ALTER TABLE "InAppNotification"
ADD COLUMN IF NOT EXISTS "eventId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "InAppNotification_userId_eventId_type_key"
ON "InAppNotification" ("userId", "eventId", "type");

CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "outboxEventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationDelivery_outboxEventId_userId_channel_key"
ON "NotificationDelivery" ("outboxEventId", "userId", "channel");

CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_createdAt_idx"
ON "NotificationDelivery" ("status", "createdAt");

CREATE INDEX IF NOT EXISTS "NotificationDelivery_userId_channel_createdAt_idx"
ON "NotificationDelivery" ("userId", "channel", "createdAt" DESC);

ALTER TABLE "NotificationDelivery"
ADD CONSTRAINT "NotificationDelivery_outboxEventId_fkey"
FOREIGN KEY ("outboxEventId") REFERENCES "DomainEventOutbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationDelivery"
ADD CONSTRAINT "NotificationDelivery_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
